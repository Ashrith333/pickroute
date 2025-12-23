import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseConnectionService implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    // Try to connect, but don't fail if it doesn't work
    try {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
        console.log('✅ Database connected successfully');
      }
    } catch (error: any) {
      console.warn('⚠️  Database connection failed - app will continue without it');
      console.warn('   Error:', error.message);
    }
  }
}

