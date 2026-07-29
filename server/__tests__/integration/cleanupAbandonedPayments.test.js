// FILE: __tests__/integration/cleanupAbandonedPayments.test.js
//
// LAYER: Integration test
// Verifies that only genuinely stale PENDING payments get marked FAILED,
// and recent/already-resolved ones are left untouched.

const prisma = require('../../config/prisma');
const { cleanupAbandonedPayments } = require('../../jobs/cleanupAbandonedPayments');

describe('cleanupAbandonedPayments', () => {
  let buyerId, staleOrderId, stalePaymentId, freshOrderId, freshPaymentId, successfulOrderId, successfulPaymentId;

  beforeAll(async () => {
    const buyer = await prisma.user.create({
      data: {
        email: `cleanup-test-${Date.now()}@example.com`,
        phoneNumber: `07${Date.now().toString().slice(-8)}`,
        passwordHash: 'unused',
        name: 'Cleanup Test Buyer',
        role: 'BUYER',
      },
    });
    buyerId = buyer.id;

    // A genuinely stale, abandoned order (created 20 minutes ago)
    const staleOrder = await prisma.order.create({
      data: { buyerId, totalAmount: 10, status: 'PENDING' },
    });
    staleOrderId = staleOrder.id;
    const stalePayment = await prisma.payment.create({
      data: { orderId: staleOrder.id, amount: 10, provider: 'MPESA', status: 'PENDING' },
    });
    stalePaymentId = stalePayment.id;
    // Manually backdate its createdAt to simulate it being old
    await prisma.payment.update({
      where: { id: stalePayment.id },
      data: { createdAt: new Date(Date.now() - 20 * 60 * 1000) },
    });

    // A fresh, recent order (should NOT be touched)
    const freshOrder = await prisma.order.create({
      data: { buyerId, totalAmount: 10, status: 'PENDING' },
    });
    freshOrderId = freshOrder.id;
    const freshPayment = await prisma.payment.create({
      data: { orderId: freshOrder.id, amount: 10, provider: 'MPESA', status: 'PENDING' },
    });
    freshPaymentId = freshPayment.id;

    // An already-successful order, even if old (should NOT be touched)
    const successfulOrder = await prisma.order.create({
      data: { buyerId, totalAmount: 10, status: 'SUCCESSFUL' },
    });
    successfulOrderId = successfulOrder.id;
    const successfulPayment = await prisma.payment.create({
      data: { orderId: successfulOrder.id, amount: 10, provider: 'MPESA', status: 'SUCCESSFUL' },
    });
    successfulPaymentId = successfulPayment.id;
    await prisma.payment.update({
      where: { id: successfulPayment.id },
      data: { createdAt: new Date(Date.now() - 30 * 60 * 1000) },
    });
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({ where: { orderId: { in: [staleOrderId, freshOrderId, successfulOrderId] } } });
    await prisma.order.deleteMany({ where: { id: { in: [staleOrderId, freshOrderId, successfulOrderId] } } });
    await prisma.user.deleteMany({ where: { id: buyerId } });
  });

  it('marks only genuinely stale PENDING payments as FAILED', async () => {
    const result = await cleanupAbandonedPayments();

    expect(result.cleaned).toBeGreaterThanOrEqual(1);

    const stalePayment = await prisma.payment.findUnique({ where: { id: stalePaymentId } });
    const staleOrder = await prisma.order.findUnique({ where: { id: staleOrderId } });
    expect(stalePayment.status).toBe('FAILED');
    expect(staleOrder.status).toBe('FAILED');
  });

  it('does not touch a recent PENDING payment', async () => {
    const freshPayment = await prisma.payment.findUnique({ where: { id: freshPaymentId } });
    const freshOrder = await prisma.order.findUnique({ where: { id: freshOrderId } });
    expect(freshPayment.status).toBe('PENDING');
    expect(freshOrder.status).toBe('PENDING');
  });

  it('does not touch an already-successful payment, even if old', async () => {
    const successfulPayment = await prisma.payment.findUnique({ where: { id: successfulPaymentId } });
    const successfulOrder = await prisma.order.findUnique({ where: { id: successfulOrderId } });
    expect(successfulPayment.status).toBe('SUCCESSFUL');
    expect(successfulOrder.status).toBe('SUCCESSFUL');
  });
});