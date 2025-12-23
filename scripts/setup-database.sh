#!/bin/bash

# Database Setup Script for PickRoute
# This script helps set up the PostgreSQL database with PostGIS

echo "🚀 PickRoute Database Setup"
echo "=========================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set it using:"
    echo "export DATABASE_URL='postgresql://postgres:[YOUR-PASSWORD]@db.ztffdnfvxqpgzwlzagkz.supabase.co:5432/postgres'"
    echo ""
    echo "Or create a .env file in the backend directory with:"
    echo "DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.ztffdnfvxqpgzwlzagkz.supabase.co:5432/postgres"
    exit 1
fi

echo "📦 Running database migration..."
echo ""

# Run the migration SQL file
psql "$DATABASE_URL" -f backend/src/database/migrations/001-initial-schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database migration completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Start Redis: docker-compose up -d redis"
    echo "2. Start backend: cd backend && npm run start:dev"
    echo "3. Start frontend: cd frontend && npm start"
else
    echo ""
    echo "❌ Database migration failed"
    echo "Please check your DATABASE_URL and database connection"
    exit 1
fi

