# Users Table Setup Guide

This guide will help you set up the `users` table in Supabase to store user information when they log in for the first time.

## Step 1: Create the Users Table

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `SUPABASE_USERS_TABLE.sql` into the SQL Editor
4. Click **Run** to execute the SQL

Alternatively, you can run the SQL directly:

```sql
-- Create the users table for storing user information from OAuth providers
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  image TEXT,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider_account_id ON users(provider_account_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Allow inserting new users" ON users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow updating user data" ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Step 2: Verify the Table

After running the SQL, verify the table was created:

1. Go to **Table Editor** in your Supabase dashboard
2. You should see the `users` table listed
3. Check that all columns are present:
   - `id` (UUID, Primary Key, Auto-generated)
   - `email` (TEXT, Unique, Not Null)
   - `name` (TEXT, Nullable)
   - `image` (TEXT, Nullable)
   - `provider` (TEXT, Not Null)
   - `provider_account_id` (TEXT, Not Null)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

## Step 3: Test the Integration

1. Make sure your `.env.local` file has the Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Start your development server:
   ```bash
   yarn dev
   ```

3. Sign in with Google on your application

4. Check the `users` table in Supabase to verify that:
   - A new row was created with the user's information
   - The `email`, `name`, `image`, `provider`, and `provider_account_id` fields are populated
   - The `created_at` timestamp is set

## How It Works

When a user signs in for the first time:

1. The `signIn` callback in NextAuth is triggered
2. The system checks if a user with that email already exists in the `users` table
3. If the user doesn't exist, a new record is created with:
   - User ID (UUID, auto-generated)
   - Email address
   - Name (if available)
   - Profile image URL (if available)
   - Provider information (Google)
   - Timestamps

4. If the user already exists, their information is updated (in case name or image changed)

## Troubleshooting

### Error: "relation 'users' does not exist"
- Make sure you've run the SQL script to create the table
- Check that you're connected to the correct Supabase project

### Error: "Missing Supabase environment variables"
- Verify your `.env.local` file has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart your development server after adding environment variables

### Users not being created
- Check the browser console and server logs for any error messages
- Verify that Row Level Security policies allow INSERT operations
- Ensure the Supabase client is properly configured with proxy settings (if needed)

## Table Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique user identifier (UUID) |
| email | TEXT | NOT NULL, UNIQUE | User's email address |
| name | TEXT | NULLABLE | User's display name |
| image | TEXT | NULLABLE | User's profile image URL |
| provider | TEXT | NOT NULL | OAuth provider (e.g., 'google') |
| provider_account_id | TEXT | NOT NULL | Account ID from the provider |
| created_at | TIMESTAMP | DEFAULT NOW() | When the user was first created |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp (auto-updated) |

