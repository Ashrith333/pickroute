# PickRoute Setup Guide

## Prerequisites

- Node.js 18+ installed
- Docker & Docker Compose installed
- PostgreSQL database (Supabase or local)
- Redis (via Docker or local)
- React Native development environment (for mobile app)

## Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your credentials:
- Set `DATABASE_URL` with your Supabase PostgreSQL connection string
- Set `JWT_SECRET` to a secure random string
- Set `MAPS_API_KEY` (Google Maps API key)
- Set payment gateway credentials if needed

5. Run database migrations:
```bash
# Connect to your Supabase database and run:
psql $DATABASE_URL -f src/database/migrations/001-initial-schema.sql
```

6. Start Redis (if using Docker):
```bash
docker-compose up -d redis
```

7. Start the backend server:
```bash
npm run start:dev
```

The backend will run on `http://localhost:3000`

## Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Update API configuration:
- Edit `src/config/index.ts` to set `API_BASE_URL` to your backend URL
- For local development: `http://localhost:3000`
- For production: your deployed backend URL

4. Start the Expo development server:
```bash
npm start
```

5. Run on iOS simulator:
```bash
npm run ios
```

6. Run on Android emulator:
```bash
npm run android
```

## Database Setup

The application uses PostgreSQL with PostGIS extension for geospatial queries.

### Required Extensions:
- PostGIS (for location-based queries)

### Key Tables:
- `users` - User accounts (customers, restaurants, admins)
- `restaurants` - Restaurant information with location
- `menu_items` - Restaurant menu items
- `orders` - Order records
- `order_items` - Order line items
- `routes` - User route plans
- `payments` - Payment transactions

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
OTP_EXPIRY_MINUTES=10
OTP_MAX_RETRIES=3
PORT=3000
NODE_ENV=development
MAPS_API_KEY=your-google-maps-api-key
PAYMENT_GATEWAY_KEY=your-payment-gateway-key
PAYMENT_GATEWAY_SECRET=your-payment-gateway-secret
```

## Testing the Application

1. **Authentication Flow:**
   - Open the app
   - Enter phone number
   - Receive OTP (check console in development)
   - Verify OTP to login

2. **User Flow:**
   - Select "Pick up on my route" or "Pick near me"
   - Set up route (if applicable)
   - Browse restaurants
   - Add items to cart
   - Confirm pickup time
   - Make payment
   - Track order
   - Complete pickup with OTP

3. **Restaurant Flow:**
   - Login as restaurant user
   - View incoming orders
   - Update order status
   - Verify pickup OTP

## Production Deployment

### Backend:
- Set `NODE_ENV=production`
- Use environment-specific database
- Configure proper CORS origins
- Set up SSL/TLS
- Use production-grade JWT secret
- Configure payment gateway webhooks

### Frontend:
- Update `API_BASE_URL` to production backend
- Build for iOS/Android using Expo build service
- Configure app.json with production settings

## Troubleshooting

### Database Connection Issues:
- Verify DATABASE_URL format
- Check Supabase connection settings
- Ensure PostGIS extension is enabled

### OTP Not Working:
- Check Redis connection
- Verify OTP expiry settings
- Check console logs for OTP (development mode)

### Maps Not Loading:
- Verify MAPS_API_KEY is set
- Check API key permissions
- Ensure billing is enabled (Google Maps)

### Payment Issues:
- Verify payment gateway credentials
- Check webhook endpoints
- Review payment logs

## Next Steps

- Implement Admin screens
- Add real-time notifications (WebSocket)
- Integrate actual payment gateway
- Add SMS service for OTP
- Implement push notifications
- Add analytics and monitoring

