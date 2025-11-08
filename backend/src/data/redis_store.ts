import { Redis } from 'ioredis';
import { REDIS_HOST, REDIS_PORT } from '@/config/env.js';
import type { Bar } from '@/utils/types.js';

class RedisStore {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
    
    this.redis.on('connect', () => console.log('Redis connected'));
    this.redis.on('error', (err) => console.error('Redis error:', err));
  }
  
  async ping(): Promise<string> {
    return await this.redis.ping();
  }

  async writeBar(bar: Bar): Promise<void> {
    const multi = this.redis.multi();
    
    multi.set(`bar:latest:${bar.symbol}`, JSON.stringify(bar));
    multi.rpush(`bar:today:${bar.symbol}`, JSON.stringify(bar));
    multi.ltrim(`bar:today:${bar.symbol}`, -10000, -1);
    multi.incr('meta:bar_count');
    
    await multi.exec();
  }

  async getLatest(symbol: string): Promise<Bar | null> {
    const data = await this.redis.get(`bar:latest:${symbol}`);
    return data ? JSON.parse(data) : null;
  }

  async getTodayBars(symbol: string): Promise<Bar[]> {
    const data = await this.redis.lrange(`bar:today:${symbol}`, 0, -1);
    return data.map(d => JSON.parse(d));
  }

  async getStats(): Promise<{ date: string; barCount: number }> {
    const date = await this.redis.get('meta:trading_date') || 'unknown';
    const count = parseInt(await this.redis.get('meta:bar_count') || '0');
    return { date, barCount: count };
  }
}

export const redisStore = new RedisStore();

