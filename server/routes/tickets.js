// FILE: src/routes/tickets.js
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');
const prisma = new PrismaClient();

/**
 * 🎟️ FETCH LIVE TICKETS FOR THE SIGNED-IN BUYER WALLET
 * GET /api/tickets/my-tickets
 */
router.get('/my-tickets', authenticateToken, async (req, res, next) => {
  try {
    // Queries database for active items belonging exclusively to the authenticated profile
    const userTickets = await prisma.ticket.findMany({
      where: { 
        buyerId: req.user.id 
      },
      include: {
        event: true,
        tier: true
      },
      orderBy: {
        id: 'desc'
      }
    });

    return res.status(200).json(userTickets);
  } catch (error) {
    console.error('Error fetching user wallet tickets:', error);
    next(error);
  }
});

/**
 * 🔒 INSTANT EYE-BALL SCAN GATE CHECKPOINT VALIDATOR ENGINE
 * POST /api/tickets/validate-gate
 */
router.post('/validate-gate', authenticateToken, requireRole(['ORGANIZER', 'ADMIN']), async (req, res, next) => {
  // 🔹 CHANGED: Destructure secretCode instead of qrHash to align with your Prisma models setup
  const { secretCode } = req.body;

  try {
    // Perform lookups on unique code index structures
    const ticket = await prisma.ticket.findFirst({
      where: { secretCode },
      include: {
        event: true,
        tier: true,
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
        holder: ticket.buyer.name
      });
    }

    if (ticket.status === 'REFUNDED') {
      return res.status(400).json({
        valid: false,
        code: 'REVOKED_ACCESS',
        message: 'Access Denied: This ticket was voided following a past dispute resolution refund settlement.'
      });
    }

    // Process pass validation transitions atomically
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
      eventTitle: ticket.event.title,
      tierLevel: ticket.tier.name,
      holderName: ticket.buyer.name
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;