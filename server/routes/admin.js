// FILE: routes/admin.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

// Every route below requires a valid token AND the ADMIN role.
router.use(authenticateToken, requireRole(['ADMIN']));

// ---------- USERS ----------

// GET /admin/users - list all users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        isBanned: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PATCH /admin/users/:id/role - change a user's role
router.patch('/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['BUYER', 'ORGANIZER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role value' });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });
    res.json({ message: `Role updated to ${role}`, user });
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: 'User not found' });
  }
});

// PATCH /admin/users/:id/ban - toggle ban status
router.patch('/users/:id/ban', async (req, res) => {
  const { id } = req.params;
  const { isBanned } = req.body;

  if (typeof isBanned !== 'boolean') {
    return res.status(400).json({ error: 'isBanned must be true or false' });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { isBanned },
    });
    res.json({ message: isBanned ? 'User banned' : 'User unbanned', user });
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: 'User not found' });
  }
});

// DELETE /admin/users/:id - permanently delete a user and their related data
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.$transaction(async (tx) => {
      const events = await tx.event.findMany({ where: { organizerId: id }, select: { id: true } });
      const eventIds = events.map(e => e.id);

      const tiers = await tx.tier.findMany({ where: { eventId: { in: eventIds } }, select: { id: true } });
      const tierIds = tiers.map(t => t.id);

      const orders = await tx.order.findMany({ where: { buyerId: id }, select: { id: true } });
      const orderIds = orders.map(o => o.id);

      await tx.ticket.deleteMany({
        where: { OR: [{ eventId: { in: eventIds } }, { tierId: { in: tierIds } }, { buyerId: id }] }
      });

      await tx.payment.deleteMany({
        where: { OR: [{ tierId: { in: tierIds } }, { orderId: { in: orderIds } }] }
      });

      await tx.order.deleteMany({ where: { buyerId: id } });
      await tx.tier.deleteMany({ where: { eventId: { in: eventIds } } });
      await tx.event.deleteMany({ where: { organizerId: id } });
      await tx.user.delete({ where: { id } });
    });

    res.json({ message: 'User and all associated data permanently deleted' });
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: 'User not found or could not be deleted' });
  }
});

// ---------- EVENTS ----------

// GET /admin/events/pending - events awaiting approval
router.get('/events/pending', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { isApproved: false },
      include: { organizer: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pending events' });
  }
});

// PATCH /admin/events/:id/approve
router.patch('/events/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    const event = await prisma.event.update({
      where: { id },
      data: { isApproved: true },
    });
    res.json({ message: 'Event approved', event });
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: 'Event not found' });
  }
});

// DELETE /admin/events/:id/reject - reject (delete) an unapproved event
router.delete('/events/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.event.delete({ where: { id } });
    res.json({ message: 'Event rejected and removed' });
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: 'Event not found' });
  }
});

// ---------- ORDERS ----------

// GET /admin/orders - all orders across all buyers
router.get('/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ---------- TICKETS ----------

// GET /admin/tickets - all tickets across all events
router.get('/tickets', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        event: { select: { id: true, title: true } },
        tier: { select: { id: true, name: true } },
        buyer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
  // GET /admin/users/:id - full detail for a single user
router.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
        events: {
          select: { id: true, title: true, venue: true, date: true, isApproved: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        tickets: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            event: { select: { title: true } },
            tier: { select: { name: true, price: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        orders: {
          select: { id: true, totalAmount: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});
});

module.exports = router;