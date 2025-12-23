import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'PickRoute API';
  }

  getConfig() {
    return {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      features: {
        routeAware: true,
        realTimeTracking: true,
        otpVerification: true,
      },
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    };
  }
}

