import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeClient();
  }

  private initializeClient() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')?.trim();
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY')?.trim();
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')?.trim();

    // Debug logging
    console.log('🔍 Supabase Config Check (Auth API):');
    console.log('  SUPABASE_URL:', supabaseUrl ? `✅ ${supabaseUrl}` : '❌ Missing');
    console.log('  Anon Key:', supabaseAnonKey ? `✅ Set (${supabaseAnonKey.substring(0, 20)}...)` : '❌ Missing');
    console.log('  Service Key:', supabaseServiceKey ? `✅ Set (${supabaseServiceKey.substring(0, 20)}...)` : '⚠️  Missing (will use anon key)');
    console.log('   Note: This is for Supabase Auth API (different from DATABASE_URL for TypeORM)');

    if (!supabaseUrl || !supabaseAnonKey) {
      const missing = [];
      if (!supabaseUrl) missing.push('SUPABASE_URL');
      if (!supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');
      throw new Error(`Supabase configuration missing: ${missing.join(', ')}. Please check your .env file.`);
    }

    // Validate URL format
    if (!supabaseUrl.startsWith('https://')) {
      throw new Error(`Invalid SUPABASE_URL format. Must start with https://. Got: ${supabaseUrl}`);
    }

    // Validate key format (JWT tokens start with eyJ)
    if (!supabaseAnonKey.startsWith('eyJ')) {
      console.warn('⚠️  SUPABASE_ANON_KEY does not look like a valid JWT token. Make sure you copied the full key.');
    }

    // Use service role key for admin operations, anon key for client operations
    const apiKey = supabaseServiceKey || supabaseAnonKey;
    
    try {
      this.supabase = createClient(supabaseUrl, apiKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      console.log('✅ Supabase client initialized successfully');
    } catch (error: any) {
      console.error('❌ Failed to initialize Supabase client:', error.message);
      throw new Error(`Failed to initialize Supabase: ${error.message}`);
    }
  }

  getClient(): SupabaseClient {
    if (!this.supabase) {
      this.initializeClient();
    }
    return this.supabase;
  }

  /**
   * Send OTP via Supabase Auth (uses Twilio)
   */
  async sendOtp(phone: string) {
    try {
      // Format phone number (ensure it starts with +)
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

      console.log(`📤 Sending OTP via Supabase to ${formattedPhone}...`);

      const { data, error } = await this.supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: 'sms',
        },
      });

      if (error) {
        console.error('❌ Supabase OTP send error:', error);
        throw error;
      }

      console.log('✅ OTP sent successfully via Supabase');
      return {
        success: true,
        message: 'OTP sent successfully',
        data,
      };
    } catch (error: any) {
      console.error('❌ Failed to send OTP via Supabase:', error.message);
      
      // Provide more helpful error messages
      if (error.message?.includes('Invalid API key')) {
        throw new Error('Invalid Supabase API key. Please check your SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY in .env file.');
      }
      if (error.message?.includes('JWT')) {
        throw new Error('Invalid Supabase API key format. Make sure you copied the complete key from Supabase dashboard.');
      }
      
      throw error;
    }
  }

  /**
   * Verify OTP via Supabase Auth
   */
  async verifyOtp(phone: string, token: string) {
    try {
      // Format phone number
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

      console.log(`🔐 Verifying OTP for ${formattedPhone}...`);

      const { data, error } = await this.supabase.auth.verifyOtp({
        phone: formattedPhone,
        token,
        type: 'sms',
      });

      if (error) {
        console.error('❌ Supabase OTP verify error:', error);
        throw error;
      }

      console.log('✅ OTP verified successfully');
      return {
        success: true,
        session: data.session,
        user: data.user,
      };
    } catch (error: any) {
      console.error('❌ Failed to verify OTP via Supabase:', error.message);
      throw error;
    }
  }

  /**
   * Get user by ID (requires service role key)
   */
  async getUserById(userId: string) {
    try {
      const { data, error } = await this.supabase.auth.admin.getUserById(userId);
      if (error) throw error;
      return data.user;
    } catch (error: any) {
      console.error('Failed to get user by ID:', error.message);
      throw error;
    }
  }
}
