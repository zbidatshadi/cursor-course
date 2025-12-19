// Configure global proxy agent for all HTTP/HTTPS requests
// This must be done before importing NextAuth to ensure proxy is active
// @ts-ignore - global-agent doesn't have TypeScript types
import { bootstrap } from 'global-agent';

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;

if (proxyUrl) {
  // Set environment variables for global-agent
  process.env.GLOBAL_AGENT_HTTP_PROXY = proxyUrl;
  process.env.GLOBAL_AGENT_HTTPS_PROXY = proxyUrl;
  // Bootstrap global-agent to enable proxy for all HTTP/HTTPS requests
  bootstrap();
}

import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { randomUUID } from 'node:crypto';
import { getSupabaseClient } from '@/lib/api-utils';

// Helper function to create a new user in Supabase
async function createUserInSupabase(supabase: ReturnType<typeof getSupabaseClient>, user: any, account: any): Promise<void> {
  const userId = randomUUID();
  const userData = {
    id: userId,
    email: user.email || '',
    name: user.name || null,
    image: user.image || null,
    provider: account.provider,
    provider_account_id: account.providerAccountId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  console.log('[SignIn] Creating new user in Supabase:', {
    email: user.email,
    userId: userId,
  });
  
  const { error: insertError } = await ((supabase
    .from('users' as any) as any)
    .insert(userData)) as { error: any };

  if (insertError) {
    console.error('[SignIn] Error creating user in Supabase:', insertError);
    throw insertError; // Throw so we can catch it upstream
  }
  
  console.log('[SignIn] ✓ New user created in Supabase:', user.email, 'with ID:', userId);
}

// Helper function to update existing user in Supabase
async function updateUserInSupabase(supabase: ReturnType<typeof getSupabaseClient>, user: any): Promise<void> {
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  
  if (user.name) updateData.name = user.name;
  if (user.image) updateData.image = user.image;
  
  const { error: updateError } = await ((supabase
    .from('users' as any) as any)
    .update(updateData)
    .eq('email', user.email || '')) as { error: any };

  if (updateError) {
    console.error('Error updating user in Supabase:', updateError);
  }
}

// Helper function to handle user sync with Supabase
async function syncUserWithSupabase(user: any, account: any) {
  const supabase = getSupabaseClient();
  
  console.log('[SignIn] Checking if user exists in Supabase:', user.email);
  
  // Check if user already exists
  const { data: existingUser, error: checkError } = await (supabase
    .from('users' as any)
    .select('id')
    .eq('email', user.email || '')
    .maybeSingle()) as { data: any; error: any };

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('[SignIn] Error checking user in Supabase:', checkError);
  }

  // If user doesn't exist, create a new one
  if (existingUser === null) {
    console.log('[SignIn] User does not exist, creating new user...');
    await createUserInSupabase(supabase, user, account);
  } else {
    console.log('[SignIn] User already exists with ID:', existingUser.id, '- updating info...');
    // Update user info if they already exist
    await updateUserInSupabase(supabase, user);
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // Note: Proxy is handled automatically via HTTPS_PROXY/HTTP_PROXY environment variables
      // Node.js and the underlying HTTP libraries will use these automatically
    }),
  ],
  callbacks: {
    // eslint-disable-next-line complexity
    // NOSONAR: NextAuth signIn callback must always return true to allow sign-in
    async signIn({ user, account }) {
      // Only process Google OAuth sign-ins
      const isGoogleSignIn = account?.provider === 'google' && user;
      
      // Allow non-Google sign-ins to proceed without processing
      if (!isGoogleSignIn) {
        return true;
      }

      // Process Google sign-in: sync user with Supabase
      // Note: We always return true to allow sign-in, even if sync fails
      try {
        await syncUserWithSupabase(user, account);
      } catch (error) {
        console.error('Unexpected error during user creation:', error);
        // Don't block sign-in if there's an error - still allow sign-in
      }
      
      // Always allow sign-in to proceed (even if sync fails)
      // This is intentional - NextAuth signIn callback should allow sign-in
      return true;
    },
    // NOSONAR: NextAuth session callback must always return session object
    async session({ session, token }) {
      // Add user ID to session
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    // NOSONAR: NextAuth jwt callback must always return token object
    async jwt({ token, user, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      // Add user email to token (persist it so it's available on subsequent calls)
      if (user?.email) {
        token.email = user.email;
      }
      // Keep existing email if user object is not available (subsequent calls)
      // The email should already be in the token from the first sign-in
      return token;
    },
    async redirect({ url, baseUrl }) {
      // After sign in, redirect to home page (unless specific callbackUrl is provided)
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/`;
      }
      // Allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'development-secret-change-in-production'),
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

