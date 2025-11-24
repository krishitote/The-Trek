// backend/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

// Authentication endpoints - strict limits to prevent brute force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { 
    error: 'Too many login attempts. Please try again in 15 minutes.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// General API endpoints - reasonable limits
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 min
  message: { 
    error: 'Too many requests. Please slow down.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File uploads - very strict
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: { 
    error: 'Upload limit reached. Please try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Activity submission - prevent spam
export const activityLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 activities per minute (generous but prevents spam)
  message: { 
    error: 'Too many activities submitted. Please wait a moment.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});
