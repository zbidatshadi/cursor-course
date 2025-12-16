# Vercel Deployment - Environment Variables Setup

## Required Environment Variables

You need to add the following environment variables in your Vercel project settings:

### 1. NextAuth Configuration

```
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-app-domain.vercel.app
```

**Important:** 
- Generate a secure `NEXTAUTH_SECRET` using: `openssl rand -base64 32`
- Replace `your-app-domain.vercel.app` with your actual Vercel deployment URL
- For production, use your custom domain if you have one
- Get the secret from your local `.env.local` file

### 2. Google OAuth Credentials

```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

**Note:** Get these values from your local `.env.local` file or Google Cloud Console

### 3. Supabase Configuration

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Note:** Get these values from your local `.env.local` file or Supabase dashboard

### 4. Proxy Configuration (Optional - only if needed)

If your Vercel deployment needs to go through a proxy:

```
HTTPS_PROXY=http://genproxy.amdocs.com:8080
HTTP_PROXY=http://genproxy.amdocs.com:8080
```

## How to Add Environment Variables in Vercel

1. **Go to your Vercel Dashboard:**
   - Navigate to [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project

2. **Open Project Settings:**
   - Click on your project
   - Go to **Settings** → **Environment Variables**

3. **Add Each Variable:**
   - Click **Add New**
   - Enter the variable name (e.g., `NEXTAUTH_SECRET`)
   - Enter the value
   - Select the environments where it should be available:
     - ✅ Production
     - ✅ Preview (optional, for PR previews)
     - ✅ Development (optional, for local dev)
   - Click **Save**

4. **Redeploy:**
   - After adding all variables, go to **Deployments**
   - Click the three dots (⋯) on the latest deployment
   - Select **Redeploy**
   - Or push a new commit to trigger a redeploy

## Important Notes

### Google OAuth Redirect URI

After deploying to Vercel, you need to update your Google OAuth configuration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Add the production redirect URI:
   ```
   https://your-app-domain.vercel.app/api/auth/callback/google
   ```
4. Add authorized JavaScript origin:
   ```
   https://your-app-domain.vercel.app
   ```

### NEXTAUTH_URL

- For production: Use your Vercel deployment URL or custom domain
- Example: `https://my-app.vercel.app` or `https://myapp.com`
- **Do NOT** use `http://localhost:3000` in production

### Security Best Practices

- Never commit `.env.local` to git (it's already in `.gitignore`)
- Use different secrets for development and production
- Rotate secrets if they're ever exposed
- Use Vercel's environment variable encryption

## Quick Checklist

- [ ] `NEXTAUTH_SECRET` added to Vercel
- [ ] `NEXTAUTH_URL` set to production URL
- [ ] `GOOGLE_CLIENT_ID` added to Vercel
- [ ] `GOOGLE_CLIENT_SECRET` added to Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_URL` added to Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` added to Vercel
- [ ] Google OAuth redirect URI updated for production
- [ ] Redeployed after adding variables

## Troubleshooting

### Still Getting "NO_SECRET" Error?

1. Verify the variable is added in Vercel dashboard
2. Check that it's enabled for "Production" environment
3. Redeploy after adding the variable
4. Check variable name spelling (case-sensitive)

### OAuth Not Working in Production?

1. Verify `NEXTAUTH_URL` matches your production domain exactly
2. Check Google OAuth redirect URI includes production URL
3. Ensure all environment variables are set correctly

