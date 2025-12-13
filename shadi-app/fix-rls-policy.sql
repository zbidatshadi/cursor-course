-- Fix RLS Policy for api_keys table
-- Run this in your Supabase SQL Editor if you're getting 403 Forbidden errors

-- First, check if the policy exists and drop it if it does
DROP POLICY IF EXISTS "Allow all operations on api_keys" ON api_keys;

-- Create the policy that allows all operations
-- This is for development/testing. In production, you should add proper authentication.
CREATE POLICY "Allow all operations on api_keys" ON api_keys
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify RLS is enabled
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Test query to verify it works (this should return rows if the policy is working)
-- SELECT * FROM api_keys LIMIT 1;

