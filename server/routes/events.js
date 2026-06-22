// FILE: src/routes/events.js
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');
const prisma = new PrismaClient();

/**
 * GET ALL APPROVED PUBLIC EVENTS
 * GET /api/events
 */
router.get('/', async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        tiers: true
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
        tiers: true
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
 * CREATE A NEW EVENT (ORGANIZER ONLY)
 * POST /api/events
 */
router.post('/', authenticateToken, requireRole(['ORGANIZER', 'ADMIN']), async (req, res, next) => {
  const { title, description, venue, date, category, tiers } = req.body;
  const organizerId = req.user.id;

  try {
    if (!title || !venue || !date || !tiers || tiers.length === 0) {
      return res.status(400).json({ error: "Missing required core event parameters." });
    }

    // Save event and its associated ticket pricing tiers together atomically
    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        venue,
        date: new Date(date),
        organizerId,
        tiers: {
          create: tiers.map(tier => ({
            name: tier.name,
            price: tier.price,
            capacity: tier.capacity
          }))
        }
      },
      include: {
        tiers: true
      }
    });

    return res.status(201).json(newEvent);
  } catch (error) {
    next(error);
  }
});

module.exports = router;