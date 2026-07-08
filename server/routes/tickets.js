// FILE: src/routes/tickets.js
const router = require('express').Router();
const prisma = require('../config/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

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

module.exports = router;