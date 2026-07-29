// FILE: jobs/cleanupAbandonedPayments.js
//
// Marks orders/payments as FAILED if they've been stuck at PENDING for
// too long — this happens when a buyer starts checkout but never
// completes the M-Pesa prompt (closes it, changes their mind, etc.).
// No ticket capacity is affected, since `sold` is only ever incremented
// on confirmed payment success, never at the PENDING stage.

const prisma = require('../config/prisma');

const ABANDONED_THRESHOLD_MINUTES = 15;

async function cleanupAbandonedPayments() {
  const cutoff = new Date(Date.now() - ABANDONED_THRESHOLD_MINUTES * 60 * 1000);

  const stalePayments = await prisma.payment.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: cutoff },
    },
  });

  if (stalePayments.length === 0) {
    return { cleaned: 0 };
  }

  const paymentIds = stalePayments.map((p) => p.id);
  const orderIds = stalePayments.map((p) => p.orderId);

  await prisma.$transaction([
    prisma.payment.updateMany({
      where: { id: { in: paymentIds } },
      data: { status: 'FAILED' },
    }),
    prisma.order.updateMany({
      where: { id: { in: orderIds }, status: 'PENDING' },
      data: { status: 'FAILED' },
    }),
  ]);

  console.log(`🧹 Cleanup: marked ${stalePayments.length} abandoned payment(s) as FAILED.`);
  return { cleaned: stalePayments.length };
}

module.exports = { cleanupAbandonedPayments, ABANDONED_THRESHOLD_MINUTES };