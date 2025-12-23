-- Migration: Add supabase_user_id to users table
-- Run this in Supabase SQL Editor or via psql

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS supabase_user_id VARCHAR(255) NULL;

CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id ON users(supabase_user_id);

COMMENT ON COLUMN users.supabase_user_id IS 'Link to Supabase Auth user ID';
