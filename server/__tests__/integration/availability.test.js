// FILE: __tests__/integration/availability.test.js
//
// LAYER: Integration test
// Confirms the real HTTP endpoint correctly fetches from the database
// and applies calculateAvailability() to produce the right numbers.

const request = require('supertest');
const app = require('../../server');
const prisma = require('../../config/prisma');

describe('GET /api/events/:id/availability', () => {
  it('returns 404 for a non-existent event', async () => {
    const response = await request(app).get('/api/events/00000000-0000-0000-0000-000000000000/availability');
    expect(response.status).toBe(404);
  });

  it('returns correct remaining counts for a real event', async () => {
    // Grab a real event from the database to test against
    const existingEvent = await prisma.event.findFirst({ include: { tiers: true } });

    if (!existingEvent) {
      console.warn('No events in database to test against — skipping.');
      return;
    }

    const response = await request(app).get(`/api/events/${existingEvent.id}/availability`);

    expect(response.status).toBe(200);
    expect(response.body.eventId).toBe(existingEvent.id);
    expect(Array.isArray(response.body.tiers)).toBe(true);

    // Confirm the math is correct for at least the first tier
    if (existingEvent.tiers.length > 0) {
      const expectedRemaining = existingEvent.tiers[0].capacity - existingEvent.tiers[0].sold;
      expect(response.body.tiers[0].remaining).toBe(Math.max(expectedRemaining, 0));
    }
  });
});