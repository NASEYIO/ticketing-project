const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CHECKOUT_ID = 'ws_CO_22062026123136102708374149'; // your ID

async function updatePayment() {
  try {
    const payment = await prisma.payment.findUnique({
      where: { checkoutRequestId: CHECKOUT_ID }
    });

    if (!payment) {
      console.log('❌ Payment not found');
      return;
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' }
    });

    console.log('✅ Payment updated:', updated);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePayment();