# 🚀 Quick Supabase Auth Setup

## ✅ What's Done

- ✅ Supabase SDK installed (backend & frontend)
- ✅ Supabase service created
- ✅ Auth service updated to use Supabase
- ✅ OTP input updated for 6-digit codes (Supabase standard)
- ✅ Migration file created for `supabase_user_id` column

## 🔧 Quick Setup (3 Steps)

### 1. Get Supabase Keys

Go to: https://supabase.com/dashboard → Your Project → Settings → API

Copy:
- **Project URL**: `https://ztffdnfvxqpgzwlzagkz.supabase.co`
- **anon public key**: `eyJhbGc...` (long string)
- **service_role key**: `eyJhbGc...` (keep secret!)

### 2. Update backend/.env

```env
SUPABASE_URL=https://ztffdnfvxqpgzwlzagkz.supabase.co
SUPABASE_ANON_KEY=paste_your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=paste_your_service_role_key_here
```

### 3. Configure Twilio in Supabase

1. Go to: **Authentication** → **Providers** → **Phone**
2. Enable Phone provider
3. Go to: **Settings** → **Auth** → **SMS Provider**
4. Add Twilio credentials:
   - Account SID
   - Auth Token  
   - Phone Number

### 4. Run Database Migration

In Supabase SQL Editor, run:

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS supabase_user_id VARCHAR(255) NULL;

CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id ON users(supabase_user_id);
```

Or use: `backend/src/database/migrations/002-add-supabase-user-id.sql`

## ✅ Done!

Restart backend and test OTP flow. Supabase will handle SMS via Twilio automatically!

## 📝 Notes

- OTP is now **6 digits** (Supabase standard)
- Phone numbers must include country code: `+1234567890`
- Supabase handles OTP expiry, rate limiting, and security
- No need to manage Twilio directly anymore!

See `SUPABASE_AUTH_SETUP.md` for detailed documentation.
