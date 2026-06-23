// FILE: src/routes/categories.js
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET ALL CATEGORIES FOR DROPDOWNS
 * GET /api/categories
 */
router.get('/', async (req, res, next) => {
  try {
    // Pulls all category records (e.g., Concerts, Tech, Sports) out of PostgreSQL
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    return res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
});

module.exports = router;