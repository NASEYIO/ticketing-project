// FILE: __tests__/integration/transfers.test.js
//
// LAYER: Integration test
// Tests the full ticket transfer flow: create → view → accept,
// against the real database, using real signed JWTs for two test users.

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const prisma = require('../../config/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_vibe_key';

function makeToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
}

describe('Ticket Transfers', () => {
  let senderId, recipientId, organizerId, eventId, tierId, ticketId;
  let senderToken, recipientToken;

  beforeAll(async () => {
    const sender = await prisma.user.create({
      data: {
        email: `sender-${Date.now()}@example.com`,
        phoneNumber: `07${Date.now().toString().slice(-8)}`,
        passwordHash: 'unused',
        name: 'Sender Test',
        role: 'BUYER',
      },
    });
    senderId = sender.id;
    senderToken = makeToken(sender);

    const recipient = await prisma.user.create({
      data: {
        email: `recipient-${Date.now()}@example.com`,
        phoneNumber: `07${(Date.now() + 1).toString().slice(-8)}`,
        passwordHash: 'unused',
        name: 'Recipient Test',
        role: 'BUYER',
      },
    });
    recipientId = recipient.id;
    recipientToken = makeToken(recipient);

    const organizer = await prisma.user.create({
      data: {
        email: `organizer-${Date.now()}@example.com`,
        phoneNumber: `07${(Date.now() + 2).toString().slice(-8)}`,
        passwordHash: 'unused',
        name: 'Organizer Test',
        role: 'ORGANIZER',
      },
    });
    organizerId = organizer.id;

    const event = await prisma.event.create({
      data: {
        title: 'Transfer Test Event',
        description: 'For testing transfers',
        venue: 'Test Venue',
        date: new Date(),
        isApproved: true,
        organizerId,
        tiers: { create: [{ name: 'General', price: 10, capacity: 5 }] },
      },
      include: { tiers: true },
    });
    eventId = event.id;
    tierId = event.tiers[0].id;

    const order = await prisma.order.create({
      data: { buyerId: senderId, totalAmount: 10, status: 'SUCCESSFUL' },
    });

    const ticket = await prisma.ticket.create({
      data: {
        orderId: order.id,
        eventId,
        tierId,
        buyerId: senderId,
        secretCode: `test-transfer-code-${Date.now()}`,
        status: 'ACTIVE',
      },
    });
    ticketId = ticket.id;
  });

  afterAll(async () => {
    await prisma.ticketTransfer.deleteMany({ where: { ticketId } });
    await prisma.ticket.deleteMany({ where: { id: ticketId } });
    await prisma.order.deleteMany({ where: { buyerId: senderId } });
    await prisma.tier.deleteMany({ where: { eventId } });
    await prisma.event.deleteMany({ where: { id: eventId } });
    await prisma.user.deleteMany({ where: { id: { in: [senderId, recipientId, organizerId] } } });
  });

  let transferCode;

  it('lets the ticket owner create a transfer', async () => {
    const response = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ ticketId });

    expect(response.status).toBe(201);
    expect(response.body.transferCode).toBeDefined();
    transferCode = response.body.transferCode;
  });

  it('blocks someone who does not own the ticket from transferring it', async () => {
    const response = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${recipientToken}`)
      .send({ ticketId });

    expect(response.status).toBe(403);
  });

  it('lets the recipient view the pending transfer', async () => {
    const response = await request(app)
      .get(`/api/transfers/${transferCode}`)
      .set('Authorization', `Bearer ${recipientToken}`);

    expect(response.status).toBe(200);
    expect(response.body.eventTitle).toBe('Transfer Test Event');
  });

  it('blocks the sender from accepting their own transfer', async () => {
    const response = await request(app)
      .post(`/api/transfers/${transferCode}/accept`)
      .set('Authorization', `Bearer ${senderToken}`);

    expect(response.status).toBe(400);
  });

  it('lets the recipient accept the transfer, moving ownership', async () => {
    const response = await request(app)
      .post(`/api/transfers/${transferCode}/accept`)
      .set('Authorization', `Bearer ${recipientToken}`);

    expect(response.status).toBe(200);

    const updatedTicket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    expect(updatedTicket.buyerId).toBe(recipientId);
  });

  it('rejects trying to accept the same transfer twice', async () => {
    const response = await request(app)
      .post(`/api/transfers/${transferCode}/accept`)
      .set('Authorization', `Bearer ${recipientToken}`);

    expect(response.status).toBe(400);
  });
});