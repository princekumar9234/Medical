const jwt = require('jsonwebtoken');

/**
 * Generate an access token (short-lived)
 */
const generateToken = (userId, role, tokenVersion) => {
  return jwt.sign(
    { id: userId, role, tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Verify a JWT token
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
