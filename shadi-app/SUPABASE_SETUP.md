# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Wait for the project to be fully provisioned

## 2. Create the Database Table

In your Supabase project, go to the SQL Editor and run the following SQL to create the `api_keys` table:

```sql
-- Create the api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dev', 'prod')),
  key TEXT NOT NULL UNIQUE,
  usage INTEGER DEFAULT 0,
  limit INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the key column for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);

-- Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON api_keys(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (you can customize this based on your auth needs)
-- For now, we'll allow all operations. In production, you should add proper authentication.
CREATE POLICY "Allow all operations on api_keys" ON api_keys
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## 3. Get Your Supabase Credentials

1. Go to your Supabase project settings
2. Navigate to **Settings** > **API**
3. Copy the following:
   - **Project URL** (this is your `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon/public key** (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## 4. Configure Environment Variables

1. Copy the `.env.local.example` file to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 5. Restart Your Development Server

After adding the environment variables, restart your Next.js development server:

```bash
npm run dev
```

## Security Notes

- The current RLS policy allows all operations. In production, you should:
  - Implement proper authentication (e.g., Supabase Auth)
  - Create user-specific policies
  - Restrict access based on user roles
  - Consider encrypting sensitive data like API keys

## Testing

Once everything is set up:
1. Navigate to `/dashboard` in your application
2. Try creating a new API key
3. Verify it appears in your Supabase dashboard under the `api_keys` table

