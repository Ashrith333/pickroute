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
import { SupabaseService } from '../supabase/supabase.service';
import { SendOtpDto, VerifyOtpDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {}

  async sendOtp(dto: SendOtpDto) {
    const { phone } = dto;

    try {
      // Use Supabase Auth to send OTP (handles Twilio integration)
      const result = await this.supabaseService.sendOtp(phone);
      
      console.log(`✅ OTP sent successfully via Supabase to ${phone}`);
      
      return {
        success: true,
        message: 'OTP sent successfully',
      };
    } catch (error: any) {
      console.error(`❌ Failed to send OTP to ${phone}:`, error.message);
      throw new BadRequestException(
        error.message || 'Failed to send OTP. Please try again.',
      );
    }
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { phone, otp, deviceId } = dto;

    try {
      // Verify OTP via Supabase Auth
      const result = await this.supabaseService.verifyOtp(phone, otp);

      if (!result.session || !result.user) {
        throw new UnauthorizedException('Invalid OTP or session expired');
      }

      const supabaseUser = result.user;
      const supabaseUserId = supabaseUser.id;

      // Find or create user in our database
      let user = await this.userRepository.findOne({ 
        where: { phone } 
      });

      if (!user) {
        // Create new user
        user = this.userRepository.create({
          phone,
          deviceId,
          role: UserRole.USER,
          isActive: true,
          // Link to Supabase user ID
          supabaseUserId: supabaseUserId,
        });
        await this.userRepository.save(user);
      } else {
        // Update existing user
        if (deviceId) {
          user.deviceId = deviceId;
        }
        if (!user.supabaseUserId) {
          user.supabaseUserId = supabaseUserId;
        }
        await this.userRepository.save(user);
      }

      // Generate our own JWT token for API authentication
      const payload = {
        sub: user.id,
        phone: user.phone,
        role: user.role,
        supabaseUserId: supabaseUserId,
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
        // Also return Supabase session for frontend use
        supabaseSession: result.session,
      };
    } catch (error: any) {
      console.error(`❌ Failed to verify OTP for ${phone}:`, error.message);
      
      if (error.message?.includes('Invalid') || error.message?.includes('expired')) {
        throw new UnauthorizedException('Invalid OTP. Please try again.');
      }
      
      throw new BadRequestException(
        error.message || 'Failed to verify OTP. Please try again.',
      );
    }
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

