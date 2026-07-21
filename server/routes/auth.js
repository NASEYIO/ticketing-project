// FILE: src/routes/auth.js
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_vibe_key';

/**
 * PRODUCTION-GRADE UNIFIED REGISTRATION ENDPOINT
 * POST /api/auth/register
 */
router.post('/register', async (req, res, next) => {
  const { email, phoneNumber, password, name, role } = req.body;

  try {
    // 1. Input Sanitization & Basic Validation
    if (!email || !phoneNumber || !password || !name) {
      return res.status(400).json({ error: 'All registration data fields are required' });
    }

    // 2. Conflict Safeguard: Check if user identity already exists in DB
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { phoneNumber: phoneNumber }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email or phone number already exists' });
    }

    // 3. Cryptographic Hashing: Protect the password signature block
    const salt = await bcrypt.genSalt(12); // Production standard salt rounds factor
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Persistence Phase: Save the clean user object profile record
    const targetRole = role === 'ORGANIZER' ? 'ORGANIZER' : 'BUYER';

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        phoneNumber: phoneNumber.trim(),
        passwordHash: hashedPassword, // 👈 ALIGNED: Changed key back to match your Prisma schema field
        name: name.trim(),
        role: targetRole
      }
    });

    // 5. Generate Runtime Token: Log them in instantly upon registration success
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' } // Standard token longevity window
    );

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * UNIFIED SINGLE SIGN-ON (SSO) LOGIN ENDPOINT
 * POST /api/auth/login
 */
router.post('/login', async (req, res, next) => {
  const { identifier, password } = req.body;

  try {
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identity matching parameters required' });
    }

    // 1. Identity Query Phase: Look up user across both email and phone index structures
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase().trim() },
          { phoneNumber: identifier.trim() }
        ]
      }
    });

    // 2. Security Timing Safety Guard: If user doesn't exist, execute a dummy hash comparison anyway
    if (!user) {
      await bcrypt.compare('dummy_password', '$2a$12$DummyHashToPreventTimingAttacksForSecurityOpenClose');
      return res.status(401).json({ error: 'Invalid login credentials provided' });
    }

    // 3. Password Check Validation Trace
    // 👈 ALIGNED: Compares password against user.passwordHash instead of user.password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid login credentials provided' });
    }

    // 3.5. Ban Check: refuse to issue a token to a banned account
    if (user.isBanned) {
      return res.status(403).json({ error: 'This account has been banned. Contact support.' });
    }

    // 4. Token Generation Phase: Pack core claim attributes inside payload signature framework
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 5. Dynamic Role Resolution Payload Response Dispatch
    return res.status(200).json({
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    next(error);
  }
});
const crypto = require('crypto');
const { Resend } = require('resend');

let resendClient = null;
function getResendClient() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}
/**
 * REQUEST PASSWORD RESET
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', async (req, res, next) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    // Always respond the same way, whether or not the email exists —
    // this prevents someone from using this endpoint to discover which
    // emails are registered on the platform.
    if (!user) {
      return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

 await getResendClient().emails.send({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

   await getResendClient().emails.send({
      from: 'VibePass <onboarding@resend.dev>',
      to: user.email,
      subject: 'Reset your VibePass password',
      html: `
        <p>Hi ${user.name},</p>
        <p>We received a request to reset your VibePass password. Click the link below to set a new one:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      `,
    });

    return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    next(error);
  }
});

/**
 * RESET PASSWORD
 * POST /api/auth/reset-password
 */
router.post('/reset-password', async (req, res, next) => {
  const { token, newPassword } = req.body;

  try {
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }, // must not be expired
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    next(error);
  }
});

module.exports = router;