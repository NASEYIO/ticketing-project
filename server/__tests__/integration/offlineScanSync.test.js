// FILE: __tests__/integration/offlineScanSync.test.js
//
// LAYER: Integration test
// Verifies offline scan syncing correctly handles: a normal successful
// scan, a genuinely duplicate/conflicting scan, and an unknown code.

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const prisma = require('../../config/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_vibe_key';

function makeToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
}

describe('Offline Scan Sync', () => {
  let organizerId, organizerToken, eventId, tierId;
  let activeTicketCode, alreadyUsedTicketCode;

  beforeAll(async () => {
    const organizer = await prisma.user.create({
      data: {
        email: `offline-sync-organizer-${Date.now()}@example.com`,
        phoneNumber: `07${Date.now().toString().slice(-8)}`,
        passwordHash: 'unused',
        name: 'Offline Sync Test Organizer',
        role: 'ORGANIZER',
      },
    });
    organizerId = organizer.id;
    organizerToken = makeToken(organizer);

    const event = await prisma.event.create({
      data: {
        title: 'Offline Sync Test Event',
        description: 'For testing offline scan sync',
        venue: 'Test Venue',
        date: new Date(),
        isApproved: true,
        organizerId,
        tiers: { create: [{ name: 'General', price: 10, capacity: 10 }] },
      },
      include: { tiers: true },
    });
    eventId = event.id;
    tierId = event.tiers[0].id;

    const order = await prisma.order.create({
      data: { buyerId: organizerId, totalAmount: 10, status: 'SUCCESSFUL' },
    });

    activeTicketCode = `OFFLINE-ACTIVE-${Date.now()}`;
    await prisma.ticket.create({
      data: {
        orderId: order.id,
        eventId,
        tierId,
        buyerId: organizerId,
        secretCode: activeTicketCode,
        status: 'ACTIVE',
      },
    });

    alreadyUsedTicketCode = `OFFLINE-USED-${Date.now()}`;
    await prisma.ticket.create({
      data: {
        orderId: order.id,
        eventId,
        tierId,
        buyerId: organizerId,
        secretCode: alreadyUsedTicketCode,
        status: 'USED',
        scannedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({ where: { eventId } });
    await prisma.order.deleteMany({ where: { buyerId: organizerId } });
    await prisma.tier.deleteMany({ where: { eventId } });
    await prisma.event.deleteMany({ where: { id: eventId } });
    await prisma.user.deleteMany({ where: { id: organizerId } });
  });

  it('downloads the correct list of codes for offline caching', async () => {
    const response = await request(app)
      .get(`/api/tickets/event/${eventId}/codes`)
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.tickets.length).toBe(2);

    const codes = response.body.tickets.map((t) => t.secretCode);
    expect(codes).toContain(activeTicketCode);
    expect(codes).toContain(alreadyUsedTicketCode);
  });

  it('successfully syncs a genuine active ticket scan', async () => {
    const response = await request(app)
      .post('/api/tickets/sync-offline-scans')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ scans: [{ secretCode: activeTicketCode, scannedAt: new Date().toISOString() }] });

    expect(response.status).toBe(200);
    expect(response.body.results[0].outcome).toBe('SYNCED');

    const updatedTicket = await prisma.ticket.findFirst({ where: { secretCode: activeTicketCode } });
    expect(updatedTicket.status).toBe('USED');
  });

  it('flags a conflict when the same ticket is already used by sync time', async () => {
    // This ticket was already USED before this sync attempt — simulating
    // two offline devices scanning the same ticket before either synced.
    const response = await request(app)
      .post('/api/tickets/sync-offline-scans')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ scans: [{ secretCode: alreadyUsedTicketCode, scannedAt: new Date().toISOString() }] });

    expect(response.status).toBe(200);
    expect(response.body.results[0].outcome).toBe('ALREADY_USED');
  });

  it('reports an unknown code as not found, without crashing the batch', async () => {
    const response = await request(app)
      .post('/api/tickets/sync-offline-scans')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ scans: [{ secretCode: 'THIS-CODE-DOES-NOT-EXIST', scannedAt: new Date().toISOString() }] });

    expect(response.status).toBe(200);
    expect(response.body.results[0].outcome).toBe('NOT_FOUND');
  });

  it('blocks an organizer from downloading codes for an event they do not own', async () => {
    const otherOrganizer = await prisma.user.create({
      data: {
        email: `other-organizer-${Date.now()}@example.com`,
        phoneNumber: `07${(Date.now() + 1).toString().slice(-8)}`,
        passwordHash: 'unused',
        name: 'Other Organizer',
        role: 'ORGANIZER',
      },
    });
    const otherToken = makeToken(otherOrganizer);

    const response = await request(app)
      .get(`/api/tickets/event/${eventId}/codes`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(response.status).toBe(403);

    await prisma.user.delete({ where: { id: otherOrganizer.id } });
  });
});