-- Migration: Add user_id column to api_keys table
-- This migration adds user_id column to associate API keys with users
-- Run this in your Supabase SQL Editor after running the initial setup

-- Step 1: Add user_id column to api_keys table
ALTER TABLE api_keys 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Step 2: Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- Step 3: Update RLS policies (Optional)
-- Note: Since we're using NextAuth (not Supabase Auth), the API routes handle
-- authentication and filtering by user_id directly. The RLS policies below
-- allow all operations at the database level, but the application layer
-- enforces user-specific access.

-- If you want to keep the existing policy, you can skip this step.
-- The current "Allow all operations on api_keys" policy is sufficient
-- since the API routes enforce user-specific access.

-- If you want to disable RLS entirely (not recommended for production):
-- ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;

-- Note: The API routes in the application handle all authentication
-- and ensure users can only access their own API keys by filtering
-- queries with user_id. This provides security at the application level.

