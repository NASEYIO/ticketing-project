// FILE: src/routes/tickets.js
const router = require('express').Router();
const crypto = require('crypto');

// 🛠️ FIX: Use a single shared PrismaClient to prevent PostgreSQL socket exhaustion
const prisma = require('../lib/prisma'); 

/**
 * 🛠️ FIXED: GET USER WALLET TICKETS (JWT Bypassed)
 * GET /api/tickets/my-wallet
 */
router.get('/my-wallet', async (req, res, next) => {
  try {
    // Grab the baseline buyer matching the record generated during checkout
    const liveBuyer = await prisma.user.findFirst({ where: { role: 'BUYER' } });
    if (!liveBuyer) {
      return res.status(404).json({ error: "No baseline buyer profile registered in database." });
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        order: {
          buyerId: liveBuyer.id
        }
      },
      include: {
        tier: {
          include: {
            event: true
          }
        }
      }
    });

    return res.status(200).json(tickets);
  } catch (error) {
    next(error);
  }
});

/**
 * PUBLIC/SEMI-PROTECTED TICKET SHORT-LINK DISCOVERY VIEW
 * GET /api/tickets/lookup/:id
 */
router.get('/lookup/:id', async (req, res, next) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        tier: {
          select: {
            name: true,
            event: {
              select: { title: true, venue: true, date: true }
            }
          }
        },
        order: {
          select: {
            buyer: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket record could not be found in the network logs." });
    }

    // Flatten into expected frontend schema payload structure
    return res.status(200).json({
      id: ticket.id,
      status: ticket.status,
      secretCode: ticket.secretCode,
      event: ticket.tier?.event,
      tier: { name: ticket.tier?.name },
      buyer: ticket.order?.buyer
    });
  } catch (error) {
    next(error);
  }
});

/**
 * INSTANT EYE-BALL SCAN GATE CHECKPOINT VALIDATOR ENGINE
 * POST /api/tickets/validate-gate
 */
router.post('/validate-gate', async (req, res, next) => {
  const { secretCode } = req.body; // Aligned from QR/signature codes to database schema key matching definitions

  try {
    const ticket = await prisma.ticket.findFirst({
      where: { secretCode },
      include: {
        tier: {
          include: { event: true }
        },
        order: {
          include: { buyer: { select: { name: true, email: true } } }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ 
        valid: false, 
        code: 'INVALID_TOKEN', 
        message: 'Security Alert: Ticket signature hash pattern matching failed. Ticket does not exist.' 
      });
    }

    if (ticket.status === 'USED') {
      return res.status(400).json({
        valid: false,
        code: 'ALREADY_USED',
        message: `Fraud Warning: This access token was already scanned and checked in on: ${ticket.scannedAt}`,
        holder: ticket.order?.buyer?.name
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
      eventTitle: ticket.tier?.event?.title,
      tierLevel: ticket.tier?.name,
      holderName: ticket.order?.buyer?.name
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;