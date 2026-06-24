// FILE: src/routes/payments.js
const router = require('express').Router();
const crypto = require('crypto');

// 🛠️ FIX 1: Point to your actual config folder path and remove local Prisma Client instantiations
const prisma = require('../config/prisma'); 

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
   CHECKOUT ROUTE (JWT Bypassed)
========================================================= */
// 🛠️ FIX 2: Removed 'authenticateToken' guard parameter completely
router.post('/checkout', async (req, res, next) => {
  const { tierId, quantity, phoneNumber } = req.body;

  let orderId = null;
  let paymentId = null;

  try {
    // 🛠️ FIX 3: Fetch active fallback BUYER from database profile table row records
    const liveBuyer = await prisma.user.findFirst({ where: { role: 'BUYER' } });
    if (!liveBuyer) {
      return res.status(404).json({ error: "No baseline buyer profile registered in database." });
    }
    const buyerId = liveBuyer.id;

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
   ORGANIZER METRICS ROUTE (JWT Bypassed)
========================================================= */
router.get('/organizer-metrics', async (req, res, next) => {
  try {
    const liveOrganizer = await prisma.user.findFirst({ where: { role: 'ORGANIZER' } });
    
    if (!liveOrganizer) {
      return res.status(404).json({ error: "No baseline organizer profile registered in database." });
    }

    const organizerId = liveOrganizer.id;

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

module.exports = router;