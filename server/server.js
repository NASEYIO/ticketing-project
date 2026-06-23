// FILE: server.js
require('dotenv').config();
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
app.use(cors({ origin: '*' })); // Allows smooth communication with your local Vite client (port 5173)
app.use(express.json()); // Parses incoming application/json body frames

// API Route Mountpoints
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/categories', categoryRoutes); // 👈 ALIGNED: Registered the dropdown endpoint data pipeline
app.use('/api/tickets', ticketRoutes);
app.use("/api/users", require("./routes/users"));
app.use("/api/admin", require("./routes/admin"));

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
app.listen(PORT, () => {
  console.log(`🚀 Production Core Routing Engine active across network port [${PORT}]`);
});