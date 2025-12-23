import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'PickRoute API';
  }

  getConfig() {
    return {
      version: '1.0.0',
      features: {
        routeAware: true,
        realTimeTracking: true,
        otpVerification: true,
      },
    };
  }
}

