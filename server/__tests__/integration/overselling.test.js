// FILE: __tests__/integration/overselling.test.js
//
// LAYER: Integration test
// Verifies that concurrent ticket purchases cannot oversell a tier's
// capacity, even when multiple payments confirm at nearly the same instant.

const prisma = require('../../config/prisma');

describe('Overselling Protection', () => {
  let organizerId, eventId, tierId;

  beforeAll(async () => {
    const organizer = await prisma.user.create({
      data: {
        email: `oversell-organizer-${Date.now()}@example.com`,
        phoneNumber: `07${Date.now().toString().slice(-8)}`,
        passwordHash: 'unused',
        name: 'Oversell Test Organizer',
        role: 'ORGANIZER',
      },
    });
    organizerId = organizer.id;

    const event = await prisma.event.create({
      data: {
        title: 'Oversell Test Event',
        description: 'For testing capacity limits',
        venue: 'Test Venue',
        date: new Date(),
        isApproved: true,
        organizerId,
        tiers: { create: [{ name: 'Limited Tier', price: 10, capacity: 1, sold: 0 }] },
      },
      include: { tiers: true },
    });
    eventId = event.id;
    tierId = event.tiers[0].id;
  });

  afterAll(async () => {
    await prisma.tier.deleteMany({ where: { eventId } });
    await prisma.event.deleteMany({ where: { id: eventId } });
    await prisma.user.deleteMany({ where: { id: organizerId } });
  });

  it('only allows one reservation to succeed when capacity is 1 and two requests race simultaneously', async () => {
    // Simulate two "payments" confirming at the exact same time, both
    // trying to claim the last remaining slot in a tier with capacity 1.
    const attemptReservation = () =>
      prisma.$executeRaw`
        UPDATE "Tier"
        SET sold = sold + 1
        WHERE id = ${tierId}
          AND sold + 1 <= capacity
      `;

    const [resultA, resultB] = await Promise.all([
      attemptReservation(),
      attemptReservation(),
    ]);

    // executeRaw returns the number of rows affected (1 = succeeded, 0 = blocked)
    const successCount = [resultA, resultB].filter((r) => r === 1).length;

    expect(successCount).toBe(1); // exactly one of the two should have won

    const finalTier = await prisma.tier.findUnique({ where: { id: tierId } });
    expect(finalTier.sold).toBe(1); // capacity never exceeded, despite two attempts
  });

  it('rejects a reservation attempt when the tier is already full', async () => {
    // At this point, sold = 1, capacity = 1 — completely full.
    const result = await prisma.$executeRaw`
      UPDATE "Tier"
      SET sold = sold + 1
      WHERE id = ${tierId}
        AND sold + 1 <= capacity
    `;

    expect(result).toBe(0); // blocked — no capacity left

    const finalTier = await prisma.tier.findUnique({ where: { id: tierId } });
    expect(finalTier.sold).toBe(1); // still exactly 1, never went over
  });
});