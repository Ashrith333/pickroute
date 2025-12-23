# Supabase Authentication Setup Guide

## ✅ What Was Changed

### Backend Changes:
1. **Installed Supabase SDK**: `@supabase/supabase-js`
2. **Created Supabase Module**: `backend/src/supabase/`
   - `supabase.module.ts` - NestJS module
   - `supabase.service.ts` - Service for Supabase Auth operations
3. **Updated Auth Service**: Now uses Supabase Auth instead of direct Twilio
4. **Updated User Entity**: Added `supabaseUserId` field to link users
5. **Removed Dependencies**: No longer need direct Twilio/SMS service

### Frontend Changes:
1. **Installed Supabase SDK**: `@supabase/supabase-js`
2. **Created Supabase Client**: `frontend/src/services/supabase.ts`
3. **Auth Screens**: Still use backend API (backend handles Supabase)

## 🔧 Setup Instructions

### Step 1: Get Supabase Credentials

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** (e.g., `https://ztffdnfvxqpgzwlzagkz.supabase.co`)
   - **anon/public key** (for frontend)
   - **service_role key** (for backend - keep secret!)

### Step 2: Configure Supabase Auth

1. Go to **Authentication** → **Providers**
2. Enable **Phone** provider
3. Configure Twilio (if not already done):
   - Go to **Settings** → **Auth** → **SMS Provider**
   - Add your Twilio credentials:
     - Account SID
     - Auth Token
     - Phone Number

### Step 3: Update Backend .env

Edit `backend/.env` and add:

```env
# Supabase Configuration
SUPABASE_URL=https://ztffdnfvxqpgzwlzagkz.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**⚠️ Important**: 
- `SUPABASE_SERVICE_ROLE_KEY` is secret - never expose it to frontend
- `SUPABASE_ANON_KEY` can be used in frontend (it's public)

### Step 4: Update Frontend (Optional)

If you want to use Supabase directly in frontend, create `.env` or update `app.json`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://ztffdnfvxqpgzwlzagkz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Or the frontend can get these from backend `/app/config` endpoint.

### Step 5: Database Migration

Add the `supabase_user_id` column to users table:

```sql
ALTER TABLE users 
ADD COLUMN supabase_user_id VARCHAR(255) NULL;

CREATE INDEX idx_users_supabase_user_id ON users(supabase_user_id);
```

Or run via Supabase SQL Editor.

## 🚀 How It Works

### Authentication Flow:

1. **User enters phone number** → Frontend calls `/auth/send-otp`
2. **Backend** → Calls `supabase.auth.signInWithOtp()` (sends SMS via Twilio)
3. **User enters OTP** → Frontend calls `/auth/verify-otp`
4. **Backend** → Calls `supabase.auth.verifyOtp()` (verifies OTP)
5. **Backend** → Creates/updates user in database, generates JWT token
6. **Frontend** → Receives JWT token and user data

### Benefits:

✅ **Managed SMS**: Supabase handles Twilio integration
✅ **Secure**: OTP verification handled by Supabase
✅ **Scalable**: No need to manage OTP storage/expiry
✅ **Rate Limiting**: Built-in protection against abuse
✅ **Session Management**: Supabase handles sessions

## 📝 API Endpoints (Unchanged)

The API endpoints remain the same:

- `POST /auth/send-otp` - Sends OTP via Supabase
- `POST /auth/verify-otp` - Verifies OTP via Supabase
- `GET /auth/session` - Gets current session

## 🔍 Testing

1. **Start Backend**:
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Test OTP Send**:
   ```bash
   curl -X POST http://localhost:3000/auth/send-otp \
     -H "Content-Type: application/json" \
     -d '{"phone": "+1234567890"}'
   ```

3. **Test OTP Verify**:
   ```bash
   curl -X POST http://localhost:3000/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"phone": "+1234567890", "otp": "1234"}'
   ```

## ⚠️ Important Notes

1. **Phone Number Format**: Must include country code with `+` (e.g., `+1234567890`)
2. **Supabase Limits**: Free tier has SMS limits - check your plan
3. **Twilio Setup**: Must configure Twilio in Supabase dashboard
4. **Service Role Key**: Keep secret - only use in backend
5. **Migration**: Don't forget to add `supabase_user_id` column

## 🐛 Troubleshooting

### OTP Not Sending:
- Check Twilio credentials in Supabase dashboard
- Verify phone number format (must have country code)
- Check Supabase logs in dashboard

### OTP Verification Fails:
- Ensure OTP is correct (6 digits from Supabase)
- Check if OTP expired (default 60 seconds)
- Verify Supabase service role key is correct

### Database Errors:
- Run migration to add `supabase_user_id` column
- Check database connection

Everything is ready! Just add your Supabase credentials to `.env` and configure Twilio in Supabase dashboard. 🚀

