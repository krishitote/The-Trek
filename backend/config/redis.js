// backend/config/redis.js
import { createClient } from 'redis';

let client = null;

export async function connectRedis() {
  // Redis is optional - app works without it
  if (!process.env.REDIS_URL) {
    console.log('⚠️  REDIS_URL not set - caching disabled (app will work normally)');
    return null;
  }
  
  try {
    client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          return retries * 100; // Exponential backoff
        }
      }
    });
    
    client.on('error', (err) => {
      console.error('Redis error:', err.message);
    });
    
    client.on('connect', () => {
      console.log('✅ Redis connected');
    });
    
    await client.connect();
    return client;
  } catch (err) {
    console.error('❌ Failed to connect to Redis:', err.message);
    console.log('⚠️  Continuing without cache - app will work normally');
    return null;
  }
}

export function getRedisClient() {
  return client;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (client) {
    console.log('Closing Redis connection...');
    await client.quit();
    console.log('✅ Redis connection closed');
  }
});
