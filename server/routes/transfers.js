// FILE: routes/transfers.js
const router = require('express').Router();
const crypto = require('crypto');
const prisma = require('../config/prisma');
const { authenticateToken } = require('../middleware/auth');
const { Resend } = require('resend');

let resendClient = null;
function getResendClient() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

/**
 * CREATE A TRANSFER — sends the recipient an email with a link to accept
 * POST /api/transfers
 */
router.post('/', authenticateToken, async (req, res, next) => {
  const { ticketId, recipientEmail } = req.body;
  const userId = req.user.id;

  try {
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required.' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { tier: { include: { event: true } } },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    if (ticket.buyerId !== userId) {
      return res.status(403).json({ error: 'You do not own this ticket.' });
    }

    if (ticket.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Only active, unused tickets can be transferred.' });
    }

    const sender = await prisma.user.findUnique({ where: { id: userId } });

    if (recipientEmail.toLowerCase().trim() === sender.email.toLowerCase()) {
      return res.status(400).json({ error: 'You cannot transfer a ticket to yourself.' });
    }

    await prisma.ticketTransfer.updateMany({
      where: { ticketId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });

    const transferCode = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.ticketTransfer.create({
      data: {
        ticketId,
        fromUserId: userId,
        recipientEmail: recipientEmail.toLowerCase().trim(),
        transferCode,
        expiresAt,
      },
    });

    const cleanFrontendUrl = (process.env.FRONTEND_URL || '').replace(/\/+$/, '');
    const acceptUrl = `${cleanFrontendUrl}/accept-transfer?code=${transferCode}`;

    await getResendClient().emails.send({
      from: 'VibePass <onboarding@resend.dev>',
      to: recipientEmail,
      subject: `${sender.name} sent you a ticket on VibePass!`,
      html: `
        <p>Hi there,</p>
        <p><b>${sender.name}</b> wants to transfer their ticket for <b>${ticket.tier.event.title}</b> to you.</p>
        <p><a href="${acceptUrl}">${acceptUrl}</a></p>
        <p>If you don't have a VibePass account yet with this email, you'll need to sign up first, then click the link again to accept.</p>
        <p>This link expires in 24 hours.</p>
      `,
    });

    return res.status(201).json({ message: `Transfer email sent to ${recipientEmail}` });
  } catch (error) {
    console.error('Create transfer error:', error);
    next(error);
  }
});

/**
 * VIEW A PENDING TRANSFER — lets the recipient see what they're about to accept
 * GET /api/transfers/:code
 */
router.get('/:code', authenticateToken, async (req, res, next) => {
  const { code } = req.params;

  try {
    const transfer = await prisma.ticketTransfer.findUnique({
      where: { transferCode: code },
      include: {
        ticket: { include: { tier: { include: { event: true } } } },
        fromUser: { select: { name: true } },
      },
    });

    if (!transfer) {
      return res.status(404).json({ error: 'This transfer link is invalid.' });
    }

    if (transfer.status !== 'PENDING') {
      return res.status(400).json({ error: `This transfer is no longer available (${transfer.status.toLowerCase()}).` });
    }

    if (transfer.expiresAt < new Date()) {
      await prisma.ticketTransfer.update({ where: { id: transfer.id }, data: { status: 'EXPIRED' } });
      return res.status(400).json({ error: 'This transfer link has expired.' });
    }

    if (transfer.fromUserId === req.user.id) {
      return res.status(400).json({ error: 'You cannot accept your own transfer.' });
    }

    return res.status(200).json({
      eventTitle: transfer.ticket.tier.event.title,
      venue: transfer.ticket.tier.event.venue,
      date: transfer.ticket.tier.event.date,
      tierName: transfer.ticket.tier.name,
      fromName: transfer.fromUser.name,
    });
  } catch (error) {
    console.error('View transfer error:', error);
    next(error);
  }
});

/**
 * ACCEPT A TRANSFER — moves ticket ownership to the logged-in user
 * POST /api/transfers/:code/accept
 */
router.post('/:code/accept', authenticateToken, async (req, res, next) => {
  const { code } = req.params;
  const newOwnerId = req.user.id;

  try {
    const transfer = await prisma.ticketTransfer.findUnique({
      where: { transferCode: code },
      include: { ticket: true },
    });

    if (!transfer) {
      return res.status(404).json({ error: 'This transfer link is invalid.' });
    }

    if (transfer.status !== 'PENDING') {
      return res.status(400).json({ error: `This transfer is no longer available.` });
    }

    if (transfer.expiresAt < new Date()) {
      await prisma.ticketTransfer.update({ where: { id: transfer.id }, data: { status: 'EXPIRED' } });
      return res.status(400).json({ error: 'This transfer link has expired.' });
    }

    if (transfer.fromUserId === newOwnerId) {
      return res.status(400).json({ error: 'You cannot accept your own transfer.' });
    }

    if (transfer.ticket.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'This ticket is no longer eligible for transfer.' });
    }

    const acceptingUser = await prisma.user.findUnique({ where: { id: newOwnerId } });
    if (acceptingUser.email.toLowerCase() !== transfer.recipientEmail.toLowerCase()) {
      return res.status(403).json({ error: 'This transfer was sent to a different email address. Please log in with that account.' });
    }

    await prisma.$transaction([
      prisma.ticket.update({
        where: { id: transfer.ticketId },
        data: { buyerId: newOwnerId },
      }),
      prisma.ticketTransfer.update({
        where: { id: transfer.id },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    return res.status(200).json({ message: 'Ticket successfully transferred to your account!' });
  } catch (error) {
    console.error('Accept transfer error:', error);
    next(error);
  }
});

/**
 * CANCEL A TRANSFER — the sender can back out before it's accepted
 * DELETE /api/transfers/:id
 */
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const transfer = await prisma.ticketTransfer.findUnique({ where: { id: req.params.id } });

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found.' });
    }

    if (transfer.fromUserId !== req.user.id) {
      return res.status(403).json({ error: 'You cannot cancel a transfer you did not create.' });
    }

    await prisma.ticketTransfer.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });

    return res.status(200).json({ message: 'Transfer cancelled.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;