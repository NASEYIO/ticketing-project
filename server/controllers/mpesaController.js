import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Helper: Generates Daraja OAuth Access Token
const getMpesaToken = async () => {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  
  // Basic Auth Base64 Encoding
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  try {
    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('MPESA token error:', error.response?.data || error.message);
    throw new Error('Failed to generate M-Pesa access token');
  }
};

// 1. Initiate STK Push Request
export const initiateStkPush = async (req, res) => {
  const { buyerId, tierId, quantity } = req.body;

  try {
    // Fetch tier info to calculate precise cost
    const tier = await prisma.tier.findUnique({
      where: { id: tierId },
      include: { event: true },
    });

    if (!tier) return res.status(404).json({ error: 'Ticket tier not found' });
    if (tier.sold + quantity > tier.capacity) {
      return res.status(400).json({ error: 'Requested tickets exceed capacity' });
    }

    const user = await prisma.user.findUnique({ where: { id: buyerId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Format phone number to Safaricom standard (2547XXXXXXXX)
    let formattedPhone = user.phoneNumber.trim().replace(/\+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    }

    const totalAmount = Number(tier.price) * quantity;

    // Create pending database entities within a transaction
    const [order, payment] = await prisma.$transaction([
      prisma.order.create({
        data: {
          buyerId,
          totalAmount,
          status: 'PENDING',
        },
      }),
      prisma.payment.create({
        data: {
          orderId: '', // placeholder, will wire up manually right below
          amount: totalAmount,
          provider: 'MPESA',
          status: 'PENDING',
          tierId,
          quantity,
        },
      }),
    ]);

    // Update cross-reference relation id securely
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { orderId: order.id },
    });

    // Generate Timestamp and Password for Daraja Payload
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(
      process.env.MPESA_SHORTCODE + process.env.MPESA_PASSKEY + timestamp
    ).toString('base64');

    const mpesaToken = await getMpesaToken();

    // Call Daraja Lipa Na M-Pesa API
    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.ceil(totalAmount), // Sandbox drops floats cleanly
        PartyA: formattedPhone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: `Order-${order.id.slice(0, 8)}`,
        TransactionDesc: `Tickets for ${tier.event.title.slice(0, 15)}`,
      },
      {
        headers: { Authorization: `Bearer ${mpesaToken}` },
      }
    );

    // Save tracking keys sent back from Safaricom gateway
    await prisma.payment.update({
      where: { id: updatedPayment.id },
      data: {
        merchantRequestId: response.data.MerchantRequestID,
        checkoutRequestId: response.data.CheckoutRequestID,
      },
    });

    return res.status(200).json({
      message: 'STK push initiated successfully!',
      checkoutRequestId: response.data.CheckoutRequestID,
      orderId: order.id,
    });
  } catch (error) {
    console.error('STK push initiation error:', error.response?.data || error);
    return res.status(500).json({ error: 'Internal server payment breakdown' });
  }
};

// 2. Process Safaricom Callbacks asynchronously
export const processMpesaCallback = async (req, res) => {
  try {
    const { Body } = req.body;
    if (!Body || !Body.stkCallback) {
      return res.status(400).json({ error: 'Invalid callback payload topology structure' });
    }

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;

    // Locate the matching record using unique tracking handles
    const payment = await prisma.payment.findUnique({
      where: { checkoutRequestId: CheckoutRequestID },
      include: { order: true },
    });

    if (!payment) {
      console.error(`Payment record matching checkout request ${CheckoutRequestID} not found.`);
      return res.status(200).send(); // Always return 200 to Safaricom to acknowledge delivery
    }

    // ResultCode === 0 means validation succeeded completely
    if (ResultCode === 0) {
      const items = CallbackMetadata.Item;
      const mpesaReceiptNumber = items.find((i) => i.Name === 'MpesaReceiptNumber')?.Value;

      // Wrap updates in a robust atomized transaction block
      await prisma.$transaction(async (tx) => {
        // 1. Mark payment as absolute success
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCESSFUL',
            mpesaReceiptNumber,
          },
        });

        // 2. Mark parent order structure successful
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: 'SUCCESSFUL' },
        });

        // 3. Update internal tier global ticket counters
        await tx.tier.update({
          where: { id: payment.tierId },
          data: { sold: { increment: payment.quantity } },
        });

        // 4. Generate tickets matching the quantity configuration purchased
        const ticketGenerations = [];
        for (let i = 0; i < payment.quantity; i++) {
          const uniqueSecret = Buffer.from(
            `${payment.orderId}-${Date.now()}-${i}-${Math.random()}`
          ).toString('hex').slice(0, 24);

          ticketGenerations.push(
            tx.ticket.create({
              data: {
                orderId: payment.orderId,
                buyerId: payment.order.buyerId,
                tierId: payment.tierId,
                eventId: (await tx.tier.findUnique({ where: { id: payment.tierId } })).eventId,
                secretCode: uniqueSecret, // perfectly aligns with your schema model
                status: 'ACTIVE',
              },
            })
          );
        }
        await Promise.all(ticketGenerations);
      });

      console.log(`Order ${payment.orderId} successfully completed via M-Pesa Receipt: ${mpesaReceiptNumber}`);
    } else {
      // Payment failed or canceled by consumer user input actions
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        }),
        prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'FAILED' },
        }),
      ]);
      console.log(`Payment failed for reference ${CheckoutRequestID}. Reason: ${ResultDesc}`);
    }

    // Explicitly notify Daraja API gateway that callback was ingested cleanly
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Callback received and processed' });
  } catch (error) {
    console.error('Error handling Safaricom callback webhook routine:', error);
    return res.status(500).json({ error: 'Callback database storage mapping fault' });
  }
};