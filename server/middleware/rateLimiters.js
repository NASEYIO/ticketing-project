// FILE: middleware/rateLimiters.js
//
// Centralized rate limiters, tuned per-endpoint based on sensitivity.
// Applied per IP address.

const rateLimit = require('express-rate-limit');

// Strict — for login/register, where brute-forcing credentials is the risk
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict — for password reset requests, to prevent email-flooding abuse
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many password reset requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderate — for public ticket verification, to prevent code-guessing
const verifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  message: { error: 'Too many verification attempts. Please try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General — a loose safety net across your whole API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, passwordResetLimiter, verifyLimiter, generalLimiter };