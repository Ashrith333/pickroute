# OTP Service Setup Guide

## Current Status

✅ **OTP Service is configured and working!**

Currently, the OTP service runs in **development mode** which:
- Generates OTP codes
- Logs them to console (check backend terminal)
- Returns OTP in API response (development only)
- Works without Redis (OTP validation is skipped)

## Network Error Fix

### Problem
The bootstrap error occurs because `localhost:3000` doesn't work on:
- Physical devices
- iOS Simulator (sometimes)
- Android Emulator (needs `10.0.2.2`)

### Solution

**Option 1: Find Your Local IP Address**

```bash
# macOS/Linux
ipconfig getifaddr en0
# or
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
# Look for IPv4 Address under your network adapter
```

**Option 2: Update API_BASE_URL**

Edit `frontend/src/config/index.ts`:

```typescript
export const API_BASE_URL = __DEV__
  ? 'http://192.168.x.x:3000' // Replace x.x with your local IP
  : 'https://api.pickroute.com';
```

**Option 3: For iOS Simulator**
- `localhost:3000` should work
- If not, use your Mac's IP address

**Option 4: For Android Emulator**
- Use `http://10.0.2.2:3000` instead of `localhost:3000`

## Setting Up SMS Service (Production)

### Option 1: Twilio (Recommended)

1. **Sign up**: https://www.twilio.com
2. **Get credentials**:
   - Account SID
   - Auth Token
   - Phone Number

3. **Add to `backend/.env`**:
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Option 2: AWS SNS

1. **Set up AWS account**
2. **Create IAM user** with SNS permissions
3. **Add to `backend/.env`**:
```env
SMS_PROVIDER=aws
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### Option 3: Msg91 (India)

1. **Sign up**: https://msg91.com
2. **Get API key**
3. **Add to `backend/.env`**:
```env
SMS_PROVIDER=msg91
MSG91_API_KEY=your_api_key
MSG91_SENDER_ID=PICKRT
```

### Option 4: Keep Console Mode (Development)

For development, you can keep using console mode:
```env
SMS_PROVIDER=console
```

OTP will be logged to backend console and returned in API response.

## Testing OTP Flow

### Development Mode (Current)

1. **Start backend**: `cd backend && npm run start:dev`
2. **Start frontend**: `cd frontend && npm start`
3. **Enter phone number** in app
4. **Check backend console** for OTP (e.g., `OTP for +1234567890: 1234`)
5. **Enter OTP** in app

### Production Mode

1. **Configure SMS provider** in `.env`
2. **Set `NODE_ENV=production`**
3. **OTP will be sent via SMS** to the phone number
4. **No OTP in API response** (security)

## Troubleshooting

### Network Error on Bootstrap

**Symptoms**: `[AxiosError: Network Error]` on app startup

**Solutions**:
1. ✅ **Fixed**: Bootstrap now handles network errors gracefully
2. Update `API_BASE_URL` to your local IP for physical devices
3. Ensure backend is running: `curl http://localhost:3000/app/config`

### OTP Not Received

**Development**:
- Check backend console for OTP
- OTP is also in API response (check Network tab)

**Production**:
- Check SMS provider logs
- Verify phone number format (include country code: +1234567890)
- Check SMS provider balance/credits
- Verify SMS provider credentials in `.env`

### Redis Not Available

- ✅ **Fixed**: App works without Redis
- OTP validation is skipped in development mode
- For production, set up Redis or use a cloud Redis service

## Quick Test

```bash
# Test backend OTP endpoint
curl -X POST http://localhost:3000/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'

# Response (development):
# {
#   "success": true,
#   "message": "OTP sent successfully",
#   "otp": "1234"  // Only in development
# }
```

## Next Steps

1. ✅ Network error handling - **Fixed**
2. ✅ OTP service structure - **Created**
3. ⏳ Configure SMS provider (when ready for production)
4. ⏳ Set up Redis (optional, for production)

The app is ready to use! OTP works in development mode (console logging).

