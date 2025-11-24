// backend/utils/tokens.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export function generateAccessToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // Short-lived access token
  );
}

export function generateRefreshToken() {
  // Generate secure random token
  return crypto.randomBytes(64).toString('hex');
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function getRefreshTokenExpiry() {
  // 7 days from now
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  return expiry;
}
