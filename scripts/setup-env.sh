#!/bin/bash

# Environment Setup Script for PickRoute

echo "🔧 PickRoute Environment Setup"
echo "=============================="
echo ""

# Backend .env
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env file..."
    cat > backend/.env << 'EOF'
# Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.ztffdnfvxqpgzwlzagkz.supabase.co:5432/postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=pickroute-super-secret-jwt-key-change-in-production-2024
JWT_EXPIRES_IN=7d

# OTP
OTP_EXPIRY_MINUTES=10
OTP_MAX_RETRIES=3

# App
PORT=3000
NODE_ENV=development

# Maps API (Google Maps or similar)
MAPS_API_KEY=your-maps-api-key

# Payment Gateway (Razorpay/Stripe)
PAYMENT_GATEWAY_KEY=your-payment-gateway-key
PAYMENT_GATEWAY_SECRET=your-payment-gateway-secret
EOF
    echo "✅ Created backend/.env"
    echo "⚠️  Please update DATABASE_URL with your actual Supabase password"
else
    echo "ℹ️  backend/.env already exists"
fi

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "⚠️  IMPORTANT: Update backend/.env with your actual credentials:"
echo "   - Replace [YOUR-PASSWORD] in DATABASE_URL with your Supabase password"
echo "   - Add your MAPS_API_KEY (optional for now)"
echo "   - Add payment gateway credentials (optional for now)"

