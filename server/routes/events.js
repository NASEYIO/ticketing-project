// FILE: src/routes/events.js
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');
const prisma = require('../config/prisma');

/**
 * GET ALL APPROVED PUBLIC EVENTS
 * GET /api/events
 */
router.get('/', async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        tiers: true,
        category: true
      },
      orderBy: {
        date: 'asc'
      }
    });
    return res.status(200).json(events);
  } catch (error) {
    next(error);
  }
});

/**
 * GET LOGGED-IN ORGANIZER'S OWN EVENTS (DASHBOARD)
 * GET /api/events/organizer/me
 */
router.get('/organizer/me', authenticateToken, requireRole('ORGANIZER'), async (req, res, next) => {
  try {
    const myEvents = await prisma.event.findMany({
      where: {
        organizerId: req.user.id
      },
      include: {
        tiers: true,
        category: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    return res.status(200).json(myEvents);
  } catch (error) {
    console.error("Dashboard Fetch Error:", error);
    next(error);
  }
});

/**
 * GET SINGLE EVENT BY ID WITH ACTIVE TIERS
 * GET /api/events/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        tiers: true,
        category: true
      }
    });

    if (!event) {
      return res.status(404).json({ error: "The requested event could not be found." });
    }

    return res.status(200).json(event);
  } catch (error) {
    next(error);
  }
});

/**
 * CREATE NEW EVENT
 * POST /api/events
 * Requires a valid organizer token; organizerId is derived from the verified JWT, not client input
 */
router.post('/', authenticateToken, requireRole('ORGANIZER'), async (req, res, next) => {
  try {
    const { title, description, venue, date, categoryId, tiers } = req.body;
    const organizerId = req.user.id;

    if (!Array.isArray(tiers) || tiers.length === 0) {
      return res.status(400).json({ error: "At least one ticket tier is required." });
    }

    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        venue,
        date: new Date(date),
        categoryId: categoryId ? categoryId : null,
        organizerId,
        isApproved: true,
        tiers: {
          create: tiers.map(t => ({
            name: t.name,
            price: t.price,
            capacity: t.capacity
          }))
        }
      },
      include: {
        tiers: true
      }
    });

    return res.status(201).json(newEvent);
  } catch (error) {
    console.error("Event Creation Error:", error);
    next(error);
  }
});

/**
 * DELETE PAST OR ERRONEOUS EVENT
 * DELETE /api/events/:id
 * Requires a valid organizer token; only the event's own organizer may delete it
 */
router.delete('/:id', authenticateToken, requireRole('ORGANIZER'), async (req, res, next) => {
  const eventId = req.params.id;

  try {
    const targetEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: { tiers: true }
    });

    if (!targetEvent) {
      return res.status(404).json({ error: "The targeted event listing does not exist." });
    }

    if (targetEvent.organizerId !== req.user.id) {
      return res.status(403).json({ error: "You do not have permission to delete this event." });
    }

    const tierIds = targetEvent.tiers.map(t => t.id);

    await prisma.$transaction(async (tx) => {
      await tx.ticket.deleteMany({
        where: { tierId: { in: tierIds } }
      });

      await tx.payment.deleteMany({
        where: { tierId: { in: tierIds } }
      });

      await tx.tier.deleteMany({
        where: { eventId: eventId }
      });

      await tx.event.delete({
        where: { id: eventId }
      });
    });

    return res.status(200).json({ message: "Event listing and all associated records purged successfully." });
  } catch (error) {
    console.error("Event Deletion Error:", error);
    next(error);
  }
});

module.exports = router;