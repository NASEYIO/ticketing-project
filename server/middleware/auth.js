// FILE: src/middleware/auth.js
const jwt = require('jsonwebtoken');
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <TOKEN>"

  if (!token) return res.status(401).json({ error: 'Access token handshake signature missing' });

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_vibe_key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Token clearance validation or lifecycle verification failed' });
    req.user = user; // Append data payloads containing id, email, role context attributes safely
    next();
  });
};

// RBAC Enforcer closure wrapper block factory function
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access privilege denied: insufficient role clearances found' });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole };