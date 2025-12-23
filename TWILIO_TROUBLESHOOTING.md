# Twilio OTP Troubleshooting Guide

## Current Configuration

✅ **SMS_PROVIDER** set to `twilio`
✅ **Twilio credentials** added to `.env`

## Common Issues & Solutions

### 1. Phone Number Format

**Problem**: Twilio requires phone numbers in E.164 format

**Solution**: Ensure phone numbers include country code with `+`
- ✅ Correct: `+1234567890` (US)
- ✅ Correct: `+919876543210` (India)
- ❌ Wrong: `1234567890` (missing +)
- ❌ Wrong: `01234567890` (leading zero)

**Fix**: The code now automatically adds `+` if missing.

### 2. Twilio Account Status

**Check your Twilio account**:
- Is your account verified?
- Do you have credits/balance?
- Is the phone number verified for trial accounts?

### 3. Phone Number Verification (Trial Accounts)

**Trial Twilio accounts** can only send to verified numbers.

**To verify a number**:
1. Go to Twilio Console → Phone Numbers → Verified Caller IDs
2. Add your test phone number
3. Verify via SMS/call

### 4. Check Backend Logs

When OTP is sent, check backend terminal for:
- ✅ `📤 Sending OTP via Twilio to +1234567890...`
- ✅ `✅ SMS sent successfully via Twilio. SID: SMxxxxx`
- ❌ `❌ Twilio SMS error:` (shows detailed error)

### 5. Test Twilio Connection

Run the test script:

```bash
cd backend
node test-twilio.js +YOUR_PHONE_NUMBER
```

Replace `+YOUR_PHONE_NUMBER` with your actual phone number (with country code).

### 6. Common Twilio Error Codes

- **21211**: Invalid 'To' phone number
- **21608**: Unverified phone number (trial account)
- **21610**: Unsubscribed phone number
- **30008**: Unknown destination handset

### 7. Verify Credentials

Check your `.env` file has correct values:

```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=AC42099ef66b185cd6adf25a6d3ebe7f34
TWILIO_AUTH_TOKEN=03b6923d168be85a0e36a31ddbdc3d58
TWILIO_PHONE_NUMBER=+17656271086
```

**Note**: Make sure there are no extra spaces or quotes.

## Debugging Steps

### Step 1: Check Backend Logs

When you request OTP, look for:
```
📤 Sending OTP via Twilio to +1234567890...
✅ SMS sent successfully via Twilio. SID: SMxxxxx
```

Or error messages with details.

### Step 2: Test Twilio Directly

```bash
cd backend
node test-twilio.js +YOUR_PHONE_NUMBER
```

### Step 3: Check Twilio Console

1. Go to https://console.twilio.com
2. Navigate to Monitor → Logs → Messaging
3. Check if messages are being sent
4. See detailed error messages

### Step 4: Verify Phone Number Format

The phone number from frontend should be in E.164 format:
- Include country code
- Start with `+`
- No spaces or dashes

Example: `+1234567890` (US), `+919876543210` (India)

## Quick Fixes

### If SMS not sending:

1. **Restart backend** after changing `.env`:
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Check phone number format** in frontend - ensure it includes country code

3. **Verify Twilio account** has credits/balance

4. **Check Twilio Console** for error messages

5. **For trial accounts**: Verify the recipient phone number in Twilio Console

## Fallback: Development Mode

If Twilio isn't working, you can temporarily switch back:

```env
SMS_PROVIDER=console
```

Then OTP will be logged to console and returned in API response.

## Next Steps

1. Check backend logs when sending OTP
2. Run test script: `node backend/test-twilio.js +YOUR_PHONE`
3. Check Twilio Console for message status
4. Verify phone number format

The improved error logging will show exactly what's wrong!

