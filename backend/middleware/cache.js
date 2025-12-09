// backend/middleware/cache.js
import { getRedisClient } from '../config/redis.js';

export function cacheMiddleware(options = {}) {
  const {
    ttl = 300,              // 5 minutes default
    keyGenerator = null,    // Custom key generator function
    condition = null,       // Conditional caching function
  } = options;
  
  return async (req, res, next) => {
    try {
      const redis = getRedisClient();
      
      // Skip if Redis not available or not connected
      if (!redis || !redis.isReady) {
        return next();
      }
      
      // Check condition (e.g., only cache GET requests)
      if (condition && !condition(req)) {
        return next();
      }
      
      // Generate cache key
      const key = keyGenerator 
        ? keyGenerator(req) 
        : `cache:${req.method}:${req.originalUrl}`;
      
      // Try to get from cache
      const cached = await redis.get(key);
      
      if (cached) {
        console.log(`✅ Cache HIT: ${key}`);
        return res.json(JSON.parse(cached));
      }
      
      console.log(`❌ Cache MISS: ${key}`);
      
      // Store original res.json
      const originalJson = res.json.bind(res);
      
      // Override res.json to cache response
      res.json = function(data) {
        // Cache the response (don't await - fire and forget)
        redis.setEx(key, ttl, JSON.stringify(data))
          .catch(err => console.error('Redis setEx failed:', err.message));
        
        // Send response
        return originalJson(data);
      };
      
      next();
    } catch (err) {
      // If cache fails, just continue without caching
      console.error('Cache middleware error:', err.message);
      return next();
    }
  };
}

// Invalidate cache helper
export async function invalidateCache(pattern) {
  const redis = getRedisClient();
  if (!redis) return;
  
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`🗑️  Invalidated ${keys.length} cache keys: ${pattern}`);
    }
  } catch (err) {
    console.error('Cache invalidation failed:', err.message);
  }
}
