# Quick Start Guide

## ✅ Step 1: Dependencies Installed

Both backend and frontend dependencies have been installed successfully!

## 🔧 Step 2: Environment Configuration

### Backend Environment Setup

1. **Create `.env` file in the backend directory:**

```bash
cd backend
```

2. **Create the `.env` file** (or run the setup script):
```bash
# From project root
./scripts/setup-env.sh
```

3. **Update the `.env` file** with your actual Supabase password:
   - Replace `[YOUR-PASSWORD]` in `DATABASE_URL` with your actual Supabase database password
   - The connection string should look like:
     ```
     DATABASE_URL=postgresql://postgres:your-actual-password@db.ztffdnfvxqpgzwlzagkz.supabase.co:5432/postgres
     ```

### Frontend Configuration

The frontend is already configured to use `http://localhost:3000` for the backend API in development mode.

## 🗄️ Step 3: Database Migration

### Option A: Using the Setup Script

```bash
# Set your DATABASE_URL first
export DATABASE_URL='postgresql://postgres:your-password@db.ztffdnfvxqpgzwlzagkz.supabase.co:5432/postgres'

# Run the migration script
./scripts/setup-database.sh
```

### Option B: Manual Migration

1. **Connect to your Supabase database** using psql or Supabase SQL Editor:

```bash
psql "postgresql://postgres:your-password@db.ztffdnfvxqpgzwlzagkz.supabase.co:5432/postgres"
```

2. **Run the migration SQL:**

```sql
-- Copy and paste the contents of:
-- backend/src/database/migrations/001-initial-schema.sql
```

Or via Supabase Dashboard:
- Go to SQL Editor
- Copy the contents of `backend/src/database/migrations/001-initial-schema.sql`
- Paste and run

### Option C: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy the entire contents of `backend/src/database/migrations/001-initial-schema.sql`
5. Paste and execute

## 🚀 Step 4: Start Services

### Start Redis

**Option 1: Using Docker**
```bash
# From project root
docker compose up -d redis
# OR (older Docker versions)
docker-compose up -d redis
```

**Option 2: Local Redis**
```bash
# If you have Redis installed locally
redis-server
```

**Option 3: Cloud Redis**
- Use a cloud Redis service (Redis Cloud, AWS ElastiCache, etc.)
- Update `REDIS_HOST` and `REDIS_PORT` in `backend/.env`

### Start Backend

```bash
cd backend
npm run start:dev
```

The backend will start on `http://localhost:3000`

### Start Frontend

In a new terminal:

```bash
cd frontend
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## 🧪 Testing the Setup

1. **Test Backend:**
   ```bash
   curl http://localhost:3000
   # Should return: PickRoute API
   
   curl http://localhost:3000/app/config
   # Should return JSON with app config
   ```

2. **Test Frontend:**
   - Open the app
   - You should see the phone authentication screen

3. **Test Authentication:**
   - Enter a phone number
   - Check backend console for OTP (in development mode)
   - Enter OTP to login

## 📝 Important Notes

1. **Database Password:** Make sure to replace `[YOUR-PASSWORD]` in the DATABASE_URL with your actual Supabase password

2. **PostGIS Extension:** The migration script enables PostGIS. If it fails, you may need to enable it manually in Supabase:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

3. **Redis:** If you don't have Docker, you can:
   - Install Redis locally: `brew install redis` (macOS) or use package manager
   - Use a cloud Redis service
   - For development, you can temporarily skip Redis (OTP won't work, but other features will)

4. **Maps API:** The MAPS_API_KEY is optional for now. The app will work with mock route data in development.

## 🐛 Troubleshooting

### Database Connection Issues
- Verify your Supabase password is correct
- Check if your IP is whitelisted in Supabase (if required)
- Ensure the database URL format is correct

### Redis Connection Issues
- Check if Redis is running: `redis-cli ping` (should return PONG)
- Verify REDIS_HOST and REDIS_PORT in .env
- For Docker: `docker ps` to see if Redis container is running

### Port Already in Use
- Backend: Change PORT in `.env` if 3000 is taken
- Redis: Change port in docker-compose.yml if 6379 is taken

### Migration Errors
- Ensure PostGIS extension can be created (may require admin privileges)
- Check if tables already exist (drop them first if needed)
- Verify you have write permissions on the database

## ✅ Checklist

- [x] Dependencies installed (backend & frontend)
- [ ] `.env` file created and configured
- [ ] Database migration executed
- [ ] Redis running
- [ ] Backend server running on port 3000
- [ ] Frontend app running
- [ ] Can access backend API
- [ ] Can see login screen in app

## 🎉 Next Steps

Once everything is running:
1. Test the authentication flow
2. Create a test restaurant (via API or database)
3. Test the order flow
4. Set up payment gateway (when ready)
5. Configure SMS service for OTP (when ready)

Happy coding! 🚀

