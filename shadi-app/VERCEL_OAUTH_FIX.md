# Fix Google OAuth Error 400: redirect_uri_mismatch on Vercel

## Quick Fix Steps

### Step 1: Update Vercel Environment Variables

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Find or add `NEXTAUTH_URL`:
   - **Value:** `https://your-app-name.vercel.app` (replace with your actual Vercel URL)
   - **Environment:** ✅ Production, ✅ Preview
   - Click **Save**

### Step 2: Update Google Cloud Console OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your project
3. Click on your **OAuth 2.0 Client ID** (the one you're using)
4. Under **Authorized redirect URIs**, add:
   ```
   https://your-app-name.vercel.app/api/auth/callback/google
   ```
   (Replace `your-app-name.vercel.app` with your actual Vercel URL)

5. Under **Authorized JavaScript origins**, add:
   ```
   https://your-app-name.vercel.app
   ```

6. Click **Save**

### Step 3: Redeploy

1. Go to Vercel Dashboard → **Deployments**
2. Click the three dots (⋯) on the latest deployment
3. Select **Redeploy**
4. Wait for deployment to complete

### Step 4: Test

Try signing in again. The error should be resolved.

## Finding Your Vercel URL

- Check your Vercel dashboard - it's shown at the top of your project
- Or check your deployment URL in the Deployments tab
- Format: `https://your-project-name.vercel.app`

## Common Issues

### Still getting the error?

1. **Double-check the URL**: Make sure there's no trailing slash
   - ✅ Correct: `https://my-app.vercel.app`
   - ❌ Wrong: `https://my-app.vercel.app/`

2. **Wait a few minutes**: Google OAuth changes can take a few minutes to propagate

3. **Clear browser cache**: Sometimes cached redirects cause issues

4. **Check both environments**: Make sure you added the redirect URI for both:
   - Production URL
   - Preview/Development URLs (if using)

### Multiple Environments

If you have multiple Vercel environments (Production, Preview, Development), add redirect URIs for each:

```
https://your-app.vercel.app/api/auth/callback/google
https://your-app-git-main.vercel.app/api/auth/callback/google
https://your-app-*.vercel.app/api/auth/callback/google
```

Or use a wildcard pattern if supported by Google Cloud Console.


