// FILE: src/routes/admin.js
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
  const { role } = req.body; // expects "BUYER" | "ORGANIZER" | "ADMIN"

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
  const { isBanned } = req.body; // expects true or false

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
});

module.exports = router;