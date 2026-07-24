// FILE: src/routes/payments.js
const router = require('express').Router();
const crypto = require('crypto');

const prisma = require('../config/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

const { Resend } = require('resend');

let resendClient = null;
function getResendClient() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

const africastalking = require('africastalking');

let smsClient = null;
function getSmsClient() {
  if (!smsClient) {
    const AfricasTalking = africastalking({
      apiKey: process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME,
    });
    smsClient = AfricasTalking.SMS;
  }
  return smsClient;
}

const MPESA_BASE_URLS = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke'
};

/* =========================================================
   CONFIG
========================================================= */
const getMpesaConfig = () => {
  const env = process.env.MPESA_ENV === 'production' ? 'production' : 'sandbox';

  const config = {
    baseUrl: MPESA_BASE_URLS[env],
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    shortcode: process.env.MPESA_SHORTCODE,
    callbackUrl: process.env.MPESA_CALLBACK_URL,
    env
  };

  const missingKeys = Object.entries(config)
    .filter(([k, v]) => !['baseUrl', 'env'].includes(k) && !v)
    .map(([k]) => k);

  return {
    config,
    isConfigured: missingKeys.length === 0,
    missingKeys
  };
};

/* =========================================================
   TIME
========================================================= */
const getMpesaTimestamp = () => {
  const now = new Date();
  const pad = (v) => String(v).padStart(2, '0');

  return (
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
};

/* =========================================================
   PHONE NORMALIZER
========================================================= */
const normalizeKenyanPhoneNumber = (phoneNumber) => {
  const digits = String(phoneNumber || '').replace(/\D/g, '');

  if (digits.startsWith('254') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.startsWith('7') && digits.length === 9) return `254${digits}`;
  if (digits.startsWith('1') && digits.length === 9) return `254${digits}`;

  throw new Error('Invalid Kenyan phone number');
};

/* =========================================================
   TOKEN
========================================================= */
const requestMpesaAccessToken = async (config) => {
  const key = String(config.consumerKey || '').trim();
  const secret = String(config.consumerSecret || '').trim();

  if (!key || !secret) {
    throw new Error('Missing M-Pesa credentials');
  }

  const credentials = Buffer.from(`${key}:${secret}`).toString('base64');

  const response = await fetch(
    `${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: `Basic ${credentials}`
      }
    }
  );

  const text = await response.text();
  const data = JSON.parse(text);

  if (!response.ok) {
    throw new Error(text);
  }

  return data.access_token;
};

/* =========================================================
   STK PUSH
========================================================= */
const sendMpesaStkPush = async ({ amount, phoneNumber, orderId, eventTitle }) => {
  const { config, isConfigured } = getMpesaConfig();

  if (!isConfigured || !config.shortcode) {
    return {
      isMock: true,
      merchantRequestId: `DEV-${Date.now()}`,
      checkoutRequestId: `DEV-${Date.now()}`,
      customerMessage: 'Mock payment (M-Pesa API client keys not configured)'
    };
  }

  const timestamp = getMpesaTimestamp();
  const passkey = process.env.MPESA_PASSKEY;
  if (!passkey) {
    throw new Error('MPESA_PASSKEY is required');
  }

  const password = Buffer
    .from(`${config.shortcode}${passkey}${timestamp}`)
    .toString('base64');

  const accessToken = await requestMpesaAccessToken(config);

  const response = await fetch(
    `${config.baseUrl}/mpesa/stkpush/v1/processrequest`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        BusinessShortCode: config.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.ceil(Number(amount)),
        PartyA: phoneNumber,
        PartyB: config.shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: config.callbackUrl,
        AccountReference: `Vibe-${orderId.slice(0, 8)}`,
        TransactionDesc: `Ticket payment for ${eventTitle}`
      })
    }
  );

  const data = await response.json();

  if (!response.ok || data.ResponseCode !== '0') {
    throw new Error(data.errorMessage || data.ResponseDescription);
  }

  return {
    isMock: false,
    merchantRequestId: data.MerchantRequestID,
    checkoutRequestId: data.CheckoutRequestID,
    customerMessage: data.CustomerMessage
  };
};

/* =========================================================
   CHECKOUT ROUTE (Authenticated)
========================================================= */
router.post('/checkout', authenticateToken, async (req, res, next) => {
  const { tierId, quantity, phoneNumber } = req.body;
  const buyerId = req.user.id;

  let orderId = null;
  let paymentId = null;

  try {
    const phone = normalizeKenyanPhoneNumber(phoneNumber);

    const result = await prisma.$transaction(async (tx) => {
      const tier = await tx.tier.findUnique({
        where: { id: tierId },
        include: { event: true }
      });

      if (!tier) throw new Error('Tier not found');

      const total = Number(tier.price) * quantity;

      const order = await tx.order.create({
        data: {
          buyerId,
          totalAmount: total,
          status: 'PENDING'
        }
      });

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: total,
          provider: 'MPESA',
          status: 'PENDING',
          tierId,
          quantity
        }
      });

      return { order, payment, tier };
    });

    orderId = result.order.id;
    paymentId = result.payment.id;

    const stk = await sendMpesaStkPush({
      amount: result.payment.amount,
      phoneNumber: phone,
      orderId: result.order.id,
      eventTitle: result.tier.event.title
    });

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        merchantRequestId: stk.merchantRequestId,
        checkoutRequestId: stk.checkoutRequestId
      }
    });

    return res.json({
      message: stk.customerMessage,
      orderId,
      paymentId,
      mode: stk.isMock ? 'mock' : 'mpesa'
    });

  } catch (err) {
    next(err);
  }
});

/* =========================================================
   ORGANIZER METRICS ROUTE (Authenticated, Organizer only)
========================================================= */
router.get('/organizer-metrics', authenticateToken, requireRole('ORGANIZER'), async (req, res, next) => {
  try {
    const organizerId = req.user.id;

    const events = await prisma.event.findMany({
      where: { organizerId: organizerId },
      include: {
        tiers: {
          include: { tickets: true }
        }
      }
    });

    let grossRevenue = 0;
    let totalTicketsSold = 0;
    const eventsList = [];

    events.forEach(evt => {
      let eventRevenue = 0;
      const tiersBreakdown = [];

      evt.tiers.forEach(tier => {
        const soldCount = tier.tickets ? tier.tickets.length : 0;
        const tierRevenue = soldCount * Number(tier.price);

        totalTicketsSold += soldCount;
        eventRevenue += tierRevenue;

        tiersBreakdown.push({
          id: tier.id,
          name: tier.name,
          capacity: tier.capacity,
          sold: soldCount
        });
      });

      grossRevenue += eventRevenue;

      eventsList.push({
        id: evt.id,
        title: evt.title,
        date: evt.date,
        venue: evt.venue || "Main Venue Gate",
        revenue: eventRevenue,
        tiers: tiersBreakdown
      });
    });

    return res.json({
      grossRevenue: grossRevenue,
      totalTicketsSold: totalTicketsSold,
      activeEventsCount: events.length,
      eventsList: eventsList
    });

  } catch (err) {
    next(err);
  }
});

/* =========================================================
   MPESA WEBHOOK CALLBACK
   POST /api/payments/callback
========================================================= */
router.post('/callback', async (req, res) => {
  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

  try {
    const { Body } = req.body;
    if (!Body || !Body.stkCallback) return;

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = Body.stkCallback;

    console.log(`Processing callback for CheckoutRequestID: ${CheckoutRequestID} with ResultCode: ${ResultCode}`);

    if (ResultCode === 0) {
      const trackingPayment = await prisma.payment.findFirst({
        where: { checkoutRequestId: CheckoutRequestID },
        include: { tier: true }
      });

      if (!trackingPayment) {
        console.error(`❌ Lookup Failed: No payment tracking found matching CheckoutRequestID ${CheckoutRequestID}`);
        return;
      }

      if (trackingPayment.status === 'SUCCESSFUL') {
        console.log(`ℹ️ Info: Payment ${trackingPayment.id} was already marked SUCCESSFUL.`);
        return;
      }

      const metadataItems = CallbackMetadata?.Item || [];
      const receiptItem = metadataItems.find(item => item.Name === 'MpesaReceiptNumber');
     
     const mpesaReceiptNumber = receiptItem ? String(receiptItem.Value) : `MPESA-${Date.now()}`;

      const parentOrder = await prisma.order.findUnique({
        where: { id: trackingPayment.orderId }
      });

      if (!parentOrder) {
        console.error(`❌ Error: Parent order row ID ${trackingPayment.orderId} missing.`);
        return;
      }

      const quantity = trackingPayment.quantity || 1;

      const soldOut = await prisma.$transaction(async (tx) => {
        // Atomic capacity reservation: this single SQL statement checks AND
        // increments `sold` in one indivisible step. If two payments confirm
        // at the same instant, Postgres guarantees only one can succeed
        // if there isn't enough room for both — this is what actually
        // prevents overselling, not just a plain read-then-write check.
        const reserved = await tx.$executeRaw`
          UPDATE "Tier"
          SET sold = sold + ${quantity}
          WHERE id = ${trackingPayment.tierId}
            AND sold + ${quantity} <= capacity
        `;

        if (reserved === 0) {
          // Payment succeeded, but capacity ran out before we could confirm it.
          // Mark the payment as successful (money was received) but flag it
          // distinctly so it can be manually refunded — do NOT create tickets.
          await tx.payment.update({
            where: { id: trackingPayment.id },
            data: {
              status: 'SUCCESSFUL',
              mpesaReceiptNumber: mpesaReceiptNumber,
            },
          });
          await tx.order.update({
            where: { id: trackingPayment.orderId },
            data: { status: 'SUCCESSFUL' },
          });
          return true; // signal: sold out, needs manual refund
        }

        await tx.payment.update({
          where: { id: trackingPayment.id },
          data: {
            status: 'SUCCESSFUL',
            mpesaReceiptNumber: mpesaReceiptNumber,
          },
        });

        await tx.order.update({
          where: { id: trackingPayment.orderId },
          data: { status: 'SUCCESSFUL' },
        });

        for (let i = 0; i < quantity; i++) {
          const uniqueSecret = `TIC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

          await tx.ticket.create({
            data: {
              orderId: trackingPayment.orderId,
              eventId: trackingPayment.tier.eventId,
              tierId: trackingPayment.tierId,
              buyerId: parentOrder.buyerId,
              status: 'ACTIVE',
              secretCode: uniqueSecret,
            },
          });
        }

        return false; // signal: tickets created normally
      });

      if (soldOut) {
        console.error(`🚨 OVERSOLD ALERT: Payment ${trackingPayment.id} succeeded but tier ${trackingPayment.tierId} had no remaining capacity. Buyer ${parentOrder.buyerId} paid but received no tickets — manual refund required.`);
      } else {
        console.log(`✅ Success Core Complete: Generated ${quantity} active tickets for Buyer ID: ${parentOrder.buyerId}`);

        const buyer = await prisma.user.findUnique({ where: { id: parentOrder.buyerId } });
        const cleanFrontendUrl = (process.env.FRONTEND_URL || '').replace(/\/+$/, '');

        // Send a purchase confirmation email — failures here are logged
        // but never block the actual ticket creation that already succeeded.
        try {
          await getResendClient().emails.send({
            from: 'VibePass <onboarding@resend.dev>',
            to: buyer.email,
            subject: `Your tickets for ${trackingPayment.tier.event.title} are confirmed!`,
            html: `
              <p>Hi ${buyer.name},</p>
              <p>Your payment was successful! You now have <b>${quantity}</b> ticket(s) for:</p>
              <p><b>${trackingPayment.tier.event.title}</b><br/>
              ${trackingPayment.tier.event.venue}<br/>
              ${new Date(trackingPayment.tier.event.date).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p>
              <p>Tier: ${trackingPayment.tier.name}</p>
              <p>M-Pesa Receipt: ${mpesaReceiptNumber}</p>
              <p><a href="${cleanFrontendUrl}/buyer/tickets">View your tickets</a></p>
            `,
          });
        } catch (emailError) {
          console.error('Failed to send purchase confirmation email:', emailError);
        }

        // Send an SMS confirmation too — separate try/catch so an SMS
        // failure never blocks or undoes the email or the ticket itself.
        try {
        await getSmsClient().send({
            to: [`+${buyer.phoneNumber.startsWith('254') ? buyer.phoneNumber : '254' + buyer.phoneNumber.slice(1)}`],
            message: `VibePass: Payment confirmed! ${quantity} ticket(s) for ${trackingPayment.tier.event.title}. View at ${cleanFrontendUrl}/buyer/tickets`,
          });
        } catch (smsError) {
          console.error('Failed to send purchase confirmation SMS:', smsError);
        }
      }
    }
  } catch (error) {
    console.error("❌ M-Pesa Callback Critical Transaction Engine Breakdown:", error);
  }
});

module.exports = router;