#!/usr/bin/env node

/**
 * Database Migration Helper
 * This script helps you run the database migration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🗄️  PickRoute Database Migration Helper\n');

// Check for DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log('❌ DATABASE_URL environment variable is not set\n');
  console.log('Please set it using:');
  console.log('export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.ztffdnfvxqpgzwlzagkz.supabase.co:5432/postgres"\n');
  console.log('Or load from .env file in backend directory\n');
  process.exit(1);
}

// Read the migration file
const migrationPath = path.join(__dirname, '../backend/src/database/migrations/001-initial-schema.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📦 Running database migration...\n');
console.log('Migration file:', migrationPath);
console.log('Database:', databaseUrl.replace(/:[^:@]+@/, ':****@')); // Hide password
console.log('');

try {
  // Execute the migration
  execSync(`psql "${databaseUrl}" -c "${migrationSQL.replace(/"/g, '\\"')}"`, {
    stdio: 'inherit',
  });
  
  console.log('\n✅ Database migration completed successfully!\n');
} catch (error) {
  console.log('\n❌ Migration failed. Please check:');
  console.log('1. Is psql installed? (brew install postgresql on macOS)');
  console.log('2. Is your DATABASE_URL correct?');
  console.log('3. Do you have permission to create extensions?');
  console.log('\nAlternative: Run the SQL manually in Supabase SQL Editor\n');
  process.exit(1);
}

