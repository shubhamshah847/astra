import 'dotenv/config';
import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URI || 'redis://127.0.0.1:6379', {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  retryStrategy: (attempt) => Math.min(attempt * 500, 5000),
});

let lastErrorLog = 0;
redis.on('error', (error) => {
  if (Date.now() - lastErrorLog > 60_000) {
    console.warn('Redis is unavailable; OTP registration and verification need Redis:', error.message);
    lastErrorLog = Date.now();
  }
});

export function connectRedis() {
  if (redis.status === 'wait') {
    redis.connect().then(
      () => console.log('Redis connected'),
      () => {}
    );
  }
}
