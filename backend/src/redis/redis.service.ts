import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get('REDIS_HOST', 'localhost');
    const port = this.configService.get('REDIS_PORT', 6379);

    this.client = new Redis({
      host,
      port,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.log(`Redis connected to ${host}:${port}`);
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      this.logger.warn(`Redis connection error: ${error.message}`);
      this.logger.warn('Redis is optional - app will continue without it (OTP features disabled)');
    });

    this.client.on('close', () => {
      this.isConnected = false;
      this.logger.warn('Redis connection closed');
    });

    // Attempt to connect, but don't fail if it doesn't
    this.client.connect().catch((error) => {
      this.logger.warn(`Failed to connect to Redis: ${error.message}`);
      this.logger.warn('App will continue without Redis. OTP features will be disabled.');
    });
  }

  getClient(): Redis {
    return this.client;
  }

  isRedisAvailable(): boolean {
    return this.isConnected;
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected) {
      this.logger.warn(`Redis not available - get(${key}) skipped`);
      return null;
    }
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.warn(`Redis get error: ${error.message}`);
      return null;
    }
  }

  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn(`Redis not available - set(${key}) skipped`);
      return;
    }
    try {
      if (expirySeconds) {
        await this.client.setex(key, expirySeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.warn(`Redis set error: ${error.message}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn(`Redis not available - del(${key}) skipped`);
      return;
    }
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.warn(`Redis del error: ${error.message}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.warn(`Redis not available - exists(${key}) skipped`);
      return false;
    }
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.warn(`Redis exists error: ${error.message}`);
      return false;
    }
  }
}

