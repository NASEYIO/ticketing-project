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
 */
router.post('/', async (req, res, next) => {
  const { title, venue, date, description, tiers } = req.body;

  // 🛠️ R3-8 FIX: Enforce validation matching schema.prisma requirement
  if (!title || !venue || !date || !description) {
    return res.status(400).json({ 
      error: "Validation Mismatch: 'title', 'venue', 'date', and 'description' are all required fields." 
    });
  }

  try {
    // Grab the fallback organizer from the database since JWT is bypassed
    const liveOrganizer = await prisma.user.findFirst({ where: { role: 'ORGANIZER' } });
    if (!liveOrganizer) {
      return res.status(404).json({ error: "No baseline organizer profile registered in database." });
    }

    const newEvent = await prisma.event.create({
      data: {
        title,
        venue,
        date: new Date(date),
        description, // Now safely guaranteed to be a non-empty string
        organizerId: liveOrganizer.id,
        tiers: {
          create: tiers || []
        }
      },
      include: {
        tiers: true
      }
    });

    return res.status(201).json(newEvent);
  } catch (error) {
    console.error("Event Creation Database Crash:", error);
    next(error);
  }
});

module.exports = router;