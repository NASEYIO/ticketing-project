// FILE: server.js
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// ALIGNED FIX: Corrected the relative directory imports to look right next to server.js
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const paymentRoutes = require('./routes/payments');
const categoryRoutes = require('./routes/categories'); // 👈 ALIGNED: Imported the new categories routing module
const ticketRoutes = require('./routes/tickets');

const app = express();

// Security Hardening Middlewares
// Adjusted helmet for relaxed development cross-origin resource sharing policies
app.use(helmet({ crossOriginResourcePolicy: false })); 

// 🛠️ DYNAMIC CORS ENGINE: Dynamically accepts changing Vercel domains + local test environments
// 🛠️ CORS: Explicit allowlist — exact matches or precise pattern checks only,
// no loose substring matching that could be exploited.
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL, // your production Vercel URL, set as an env var
].filter(Boolean); // removes any undefined entries

// Vercel preview deployments get unique subdomains per branch/PR
// (e.g. client-git-feature-x-yourteam.vercel.app), so we match those
// precisely by pattern rather than a loose substring check.
const vercelPreviewPattern = /^https:\/\/client-[a-z0-9-]+\.vercel\.app$/;

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // mobile apps, curl, Postman, etc.

    const isExactMatch = allowedOrigins.includes(origin);
    const isVercelPreview = vercelPreviewPattern.test(origin);

    if (isExactMatch || isVercelPreview) {
      callback(null, true);
    } else {
      console.log(`⚠️ CORS Blocked Origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));

app.use(express.json()); // Parses incoming application/json body frames
const { generalLimiter } = require('./middleware/rateLimiters');
app.use(generalLimiter);
// API Route Mountpoints
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/categories', categoryRoutes); // 👈 ALIGNED: Registered the dropdown endpoint data pipeline
app.use('/api/tickets', ticketRoutes);
app.use("/api/users", require("./routes/users"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/transfers", require("./routes/transfers"));

// Catch-all Fallback Endpoint Route
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint destination requested not found on this map' });
});

// Centralized Intercept Error Router middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Panic Exception Context:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal critical application pipeline error handled'
  });
});

const PORT = process.env.PORT || 5000;

// Only start listening on a real port when this file is run directly
// (e.g. `node server.js`). When Jest imports this file for testing,
// it just gets the configured app, without binding to a port.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Production Core Routing Engine active across network port [${PORT}]`);
  });
}

module.exports = app;