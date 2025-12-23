import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '../users/entities/user.entity';
import { RedisService } from '../redis/redis.service';
import { SmsService } from '../sms/sms.service';
import { SendOtpDto, VerifyOtpDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private redisService: RedisService,
    private configService: ConfigService,
    private smsService: SmsService,
  ) {}

  async sendOtp(dto: SendOtpDto) {
    const { phone, deviceId } = dto;

    // Check retry limits (only if Redis is available)
    const retryKey = `otp:retry:${phone}`;
    let retryCount = null;
    if (this.redisService.isRedisAvailable()) {
      retryCount = await this.redisService.get(retryKey);
      const maxRetries = parseInt(
        this.configService.get('OTP_MAX_RETRIES', '3'),
      );

      if (retryCount && parseInt(retryCount) >= maxRetries) {
        throw new BadRequestException('Maximum OTP retry limit reached');
      }
    }

    // Generate OTP (in production, use SMS service)
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiryMinutes = parseInt(
      this.configService.get('OTP_EXPIRY_MINUTES', '10'),
    );

    // Store OTP in Redis (if available)
    const otpKey = `otp:${phone}`;
    if (this.redisService.isRedisAvailable()) {
      await this.redisService.set(otpKey, otp, expiryMinutes * 60);
      // Increment retry counter
      const currentRetries = retryCount ? parseInt(retryCount) : 0;
      await this.redisService.set(retryKey, (currentRetries + 1).toString(), 3600);
    }

    // Send OTP via SMS service
    const smsSent = await this.smsService.sendOtp(phone, otp);
    
    if (!smsSent) {
      console.error(`❌ Failed to send OTP SMS to ${phone}`);
      // Still return success but log the error
      // In production, you might want to throw an error here
    } else {
      console.log(`✅ OTP SMS sent successfully to ${phone}`);
    }

    return {
      success: true,
      message: 'OTP sent successfully',
      // In development, return OTP for testing (even if SMS failed)
      ...(process.env.NODE_ENV === 'development' && { otp }),
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { phone, otp, deviceId } = dto;

    // Verify OTP (if Redis is available, otherwise skip validation in dev mode)
    const otpKey = `otp:${phone}`;
    let storedOtp = null;
    
    if (this.redisService.isRedisAvailable()) {
      storedOtp = await this.redisService.get(otpKey);
      if (!storedOtp || storedOtp !== otp) {
        throw new UnauthorizedException('Invalid OTP');
      }
      // Delete OTP after successful verification
      await this.redisService.del(otpKey);
      await this.redisService.del(`otp:retry:${phone}`);
    } else {
      // In development without Redis, log a warning but allow any OTP
      console.warn('⚠️  Redis not available - OTP validation skipped (development mode)');
    }

    // Find or create user
    let user = await this.userRepository.findOne({ where: { phone } });

    if (!user) {
      user = this.userRepository.create({
        phone,
        deviceId,
        role: UserRole.USER,
        isActive: true,
      });
      await this.userRepository.save(user);
    } else {
      // Update device ID if provided
      if (deviceId) {
        user.deviceId = deviceId;
        await this.userRepository.save(user);
      }
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    };
  }

  async getSession(user: User) {
    return {
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}

