# How to Run PickRoute 🚀

## Quick Start (3 Steps)

### Step 1: Update Database Password (if not done)
Edit `backend/.env` and replace `[YOUR-PASSWORD]` with your actual Supabase password.

### Step 2: Run Database Migration
Choose one method:

**Method A: Supabase Dashboard (Easiest)**
1. Go to https://supabase.com/dashboard
2. Open your project → SQL Editor
3. Copy contents of `backend/src/database/migrations/001-initial-schema.sql`
4. Paste and click Run

**Method B: Command Line**
```bash
# Set your password first
export DATABASE_URL='postgresql://postgres:YOUR_PASSWORD@db.ztffdnfvxqpgzwlzagkz.supabase.co:5432/postgres'

# Run migration
psql "$DATABASE_URL" -f backend/src/database/migrations/001-initial-schema.sql
```

### Step 3: Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

**Terminal 3 - Redis (Optional, if using Docker):**
```bash
docker compose up -d redis
```

## Detailed Instructions

### 1. Start Backend Server

```bash
cd backend
npm run start:dev
```

You should see:
```
Application is running on: http://localhost:3000
```

### 2. Start Frontend App

Open a NEW terminal window:

```bash
cd frontend
npm start
```

This will:
- Start Expo development server
- Show a QR code
- Open options to run on iOS/Android

**Options:**
- Press `i` - Run on iOS simulator
- Press `a` - Run on Android emulator
- Scan QR code with Expo Go app on your phone

### 3. Start Redis (Optional)

If you have Docker:
```bash
docker compose up -d redis
```

Or if Redis is installed locally:
```bash
redis-server
```

**Note:** Redis is optional for now. The app will work without it, but OTP features won't function properly.

## Testing

### Test Backend API:
```bash
curl http://localhost:3000
# Should return: PickRoute API

curl http://localhost:3000/app/config
# Should return JSON config
```

### Test Frontend:
1. Open the app (iOS/Android simulator or phone)
2. You should see the phone authentication screen
3. Enter a phone number
4. Check backend console for OTP (in development mode)
5. Enter OTP to login

## Troubleshooting

### Backend won't start:
- Check if port 3000 is available
- Verify `.env` file exists and has correct DATABASE_URL
- Make sure database migration ran successfully

### Frontend won't start:
- Make sure backend is running first
- Check if port 19000/19001 are available (Expo ports)
- Try clearing cache: `npm start -- --clear`

### Database connection errors:
- Verify DATABASE_URL in `.env` has correct password
- Check Supabase dashboard to ensure database is accessible
- Ensure PostGIS extension is enabled

### Redis connection errors:
- Redis is optional - app works without it
- If needed, install Redis or use Docker
- Or use a cloud Redis service

## What's Running?

✅ Backend: http://localhost:3000
✅ Frontend: Expo dev server (port 19000)
✅ Redis: localhost:6379 (if started)

## Next Steps After Running

1. Test authentication flow
2. Create test restaurant data (via API or database)
3. Test order flow
4. Configure payment gateway (when ready)
5. Set up SMS service for OTP (when ready)

Happy coding! 🎉
