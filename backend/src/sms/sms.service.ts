import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SmsService {
  constructor(private configService: ConfigService) {}

  async sendOtp(phone: string, otp: string): Promise<boolean> {
    const provider = this.configService.get('SMS_PROVIDER', 'console'); // 'twilio', 'aws', 'msg91', 'console'

    switch (provider) {
      case 'twilio':
        return this.sendViaTwilio(phone, otp);
      case 'aws':
        return this.sendViaAWS(phone, otp);
      case 'msg91':
        return this.sendViaMsg91(phone, otp);
      case 'console':
      default:
        // Development mode - just log
        console.log(`📱 OTP for ${phone}: ${otp}`);
        return true;
    }
  }

  private async sendViaTwilio(phone: string, otp: string): Promise<boolean> {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    const fromNumber = this.configService.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      console.error('❌ Twilio credentials not configured');
      console.error('Missing:', {
        accountSid: !accountSid,
        authToken: !authToken,
        fromNumber: !fromNumber,
      });
      return false;
    }

    // Ensure phone number has country code
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

    try {
      console.log(`📤 Sending OTP via Twilio to ${formattedPhone}...`);
      
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        new URLSearchParams({
          To: formattedPhone,
          From: fromNumber,
          Body: `Your PickRoute OTP is ${otp}. Valid for 10 minutes.`,
        }),
        {
          auth: {
            username: accountSid,
            password: authToken,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      if (response.status === 201) {
        console.log(`✅ SMS sent successfully via Twilio. SID: ${response.data.sid}`);
        return true;
      } else {
        console.error('❌ Twilio returned unexpected status:', response.status);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Twilio SMS error:');
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Error:', error.message);
      }
      return false;
    }
  }

  private async sendViaAWS(phone: string, otp: string): Promise<boolean> {
    // AWS SNS implementation
    // Requires AWS SDK: npm install @aws-sdk/client-sns
    const region = this.configService.get('AWS_REGION', 'us-east-1');
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');

    if (!accessKeyId || !secretAccessKey) {
      console.error('AWS credentials not configured');
      return false;
    }

    // TODO: Implement AWS SNS
    console.log('AWS SNS not yet implemented');
    return false;
  }

  private async sendViaMsg91(phone: string, otp: string): Promise<boolean> {
    const apiKey = this.configService.get('MSG91_API_KEY');
    const senderId = this.configService.get('MSG91_SENDER_ID', 'PICKRT');

    if (!apiKey) {
      console.error('Msg91 API key not configured');
      return false;
    }

    try {
      const response = await axios.get('https://api.msg91.com/api/v5/otp', {
        params: {
          authkey: apiKey,
          mobile: phone,
          message: `Your PickRoute OTP is ${otp}`,
          sender: senderId,
          otp: otp,
          otp_expiry: 10, // minutes
        },
      });

      return response.data.type === 'success';
    } catch (error: any) {
      console.error('Msg91 SMS error:', error.response?.data || error.message);
      return false;
    }
  }
}

