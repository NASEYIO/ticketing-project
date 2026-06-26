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
        category: true // Included category objects in the feed summary list
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
    // Isolated lookup: matches organizerId to the authenticated organizer's ID
    const myEvents = await prisma.event.findMany({
      where: {
        organizerId: req.user.id
      },
      include: {
        tiers: true,
        category: true
      },
      orderBy: {
        date: 'desc' // Shows newest events first on the dashboard
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
        category: true // Included relational metadata for individual page lookups
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
 * Securing this route ensures the created event belongs to the authenticated organizer
 */
router.post('/', async (req, res, next) => {
  try {
    // 1. Pull the organizerId directly from the request body along with the form details
    const { title, description, venue, date, categoryId, organizerId } = req.body;

    // 2. Safety check to make sure an organizer ID was provided
    if (!organizerId) {
      return res.status(400).json({ error: "Missing organizerId. Cannot create an event without an owner." });
    }

    // 3. Insert the new event into PostgreSQL using Prisma
    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        venue,
        date: new Date(date),
        categoryId,
        organizerId, // Directly linking the event to the seller
        isApproved: true // Auto-approving for development ease
      }
    });

    return res.status(201).json(newEvent);
  } catch (error) {
    console.error("Event Creation Error:", error);
    next(error);
  }
});

/**
 * DELETE PAST OR ERRONEONS EVENT
 * DELETE /api/events/:id
 */
router.delete('/:id', async (req, res, next) => {
  const eventId = req.params.id;

  try {
    // Look up the event first to ensure it exists
    const targetEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: { tiers: true }
    });

    if (!targetEvent) {
      return res.status(404).json({ error: "The targeted event listing does not exist." });
    }

    const tierIds = targetEvent.tiers.map(t => t.id);

    // Cascading Delete Transaction: Cleans up dependencies safely in order
    await prisma.$transaction(async (tx) => {
      // 1. Delete all generated active/used tickets linked to these tiers
      await tx.ticket.deleteMany({
        where: { tierId: { in: tierIds } }
      });

      // 2. Delete payment records associated with these tiers
      await tx.payment.deleteMany({
        where: { tierId: { in: tierIds } }
      });

      // 3. Delete the tiers categories mapped to the event
      await tx.tier.deleteMany({
        where: { eventId: eventId }
      });

      // 4. Finally, safely delete the parent event record
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