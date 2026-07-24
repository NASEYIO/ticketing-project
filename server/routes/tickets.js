// FILE: src/routes/tickets.js
const router = require('express').Router();
const prisma = require('../config/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { verifyLimiter } = require('../middleware/rateLimiters');
/**
 * 🎟️ FETCH LIVE TICKETS FOR THE SIGNED-IN BUYER WALLET
 * GET /api/tickets/my-wallet
 */
router.get('/my-wallet', authenticateToken, async (req, res, next) => {
  try {
    const buyerId = req.user.id; // the actual logged-in user, from their verified JWT

    const tickets = await prisma.ticket.findMany({
      where: {
        buyerId: buyerId
      },
      include: {
        tier: {
          include: {
            event: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    return res.status(200).json(tickets);
  } catch (error) {
    console.error('Error fetching user wallet tickets:', error);
    next(error);
  }
});

/**
 * 🔒 GATE CHECKPOINT VALIDATOR
 * Restricted to Organizer/Admin staff only — anyone scanning entry must be authenticated
 * POST /api/tickets/validate-gate
 */
router.post('/validate-gate', authenticateToken, requireRole(['ORGANIZER', 'ADMIN']), async (req, res, next) => {
  const { secretCode } = req.body;

  try {
    const ticket = await prisma.ticket.findFirst({
      where: { secretCode },
      include: {
        tier: {
          include: {
            event: true
          }
        },
        buyer: { select: { name: true, email: true } }
      }
    });

    if (!ticket) {
      return res.status(404).json({
        valid: false,
        code: 'INVALID_TOKEN',
        message: 'Security Alert: Ticket signature pattern matching failed. Ticket does not exist.'
      });
    }

    if (ticket.status === 'USED') {
      return res.status(400).json({
        valid: false,
        code: 'ALREADY_USED',
        message: `Fraud Warning: This access token was already scanned and checked in on: ${ticket.scannedAt}`,
        holder: ticket.buyer?.name || "Guest"
      });
    }

    if (ticket.status === 'REFUNDED') {
      return res.status(400).json({
        valid: false,
        code: 'REVOKED_ACCESS',
        message: 'Access Denied: This ticket was voided following a past dispute resolution refund settlement.'
      });
    }

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: 'USED',
        scannedAt: new Date()
      }
    });

    return res.status(200).json({
      valid: true,
      message: 'Access Granted: Validation check complete.',
      eventTitle: ticket.tier?.event?.title || "Live Event",
      tierLevel: ticket.tier?.name || "Standard",
      holderName: ticket.buyer?.name || "Guest Holder"
    });

  } catch (error) {
    next(error);
  }
});
/**
 * 🔍 PUBLIC TICKET VERIFICATION
 * GET /api/tickets/verify/:secretCode
 */
router.get('/verify/:secretCode', verifyLimiter, async (req, res, next) => {
  const { secretCode } = req.params;

  try {
    const ticket = await prisma.ticket.findFirst({
      where: { secretCode },
      include: {
        tier: {
          include: {
            event: {
              select: { title: true, venue: true, date: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        valid: false,
        status: 'NOT_FOUND',
        message: 'This ticket code does not exist in our system. Do not proceed with this purchase.',
      });
    }

    if (ticket.status === 'USED') {
      return res.status(200).json({
        valid: false,
        status: 'USED',
        message: 'This ticket has already been used to enter the event. It cannot be valid for a new buyer.',
        eventTitle: ticket.tier.event.title,
      });
    }

    if (ticket.status === 'REFUNDED') {
      return res.status(200).json({
        valid: false,
        status: 'REFUNDED',
        message: 'This ticket was refunded and is no longer valid.',
        eventTitle: ticket.tier.event.title,
      });
    }

    return res.status(200).json({
      valid: true,
      status: 'ACTIVE',
      message: 'This ticket is genuine and has not yet been used.',
      eventTitle: ticket.tier.event.title,
      venue: ticket.tier.event.venue,
      date: ticket.tier.event.date,
      tierName: ticket.tier.name,
    });
  } catch (error) {
    console.error('Ticket verification error:', error);
    next(error);
  }
});

/**
 * GET A SINGLE TICKET BY ID — for the dedicated ticket pass page
 * GET /api/tickets/:id
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        tier: { include: { event: true } },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    if (ticket.buyerId !== req.user.id) {
      return res.status(403).json({ error: 'This ticket does not belong to you.' });
    }

    return res.status(200).json(ticket);
  } catch (error) {
    console.error('Get single ticket error:', error);
    next(error);
  }
});
module.exports = router;