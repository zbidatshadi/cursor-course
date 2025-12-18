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
    async signIn({ user, account, profile }) {
      // Only process Google OAuth sign-ins
      if (account?.provider === 'google' && user) {
        try {
          const supabase = getSupabaseClient();
          
          // Check if user already exists
          const { data: existingUser, error: checkError } = await (supabase
            .from('users' as any)
            .select('id')
            .eq('email', user.email || '')
            .maybeSingle()) as { data: any; error: any };

          // If user doesn't exist, create a new one
          if (existingUser === null) {
            // Generate a UUID for the user ID
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
            
            const { error: insertError } = await ((supabase
              .from('users' as any) as any)
              .insert(userData)) as { error: any };

            if (insertError) {
              console.error('Error creating user in Supabase:', insertError);
              // Don't block sign-in if user creation fails
            } else {
              console.log('New user created in Supabase:', user.email);
            }
          } else {
            // Update user info if they already exist (in case name/image changed)
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
          
          if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking user in Supabase:', checkError);
          }
        } catch (error) {
          console.error('Unexpected error during user creation:', error);
          // Don't block sign-in if there's an error
        }
      }
      
      return true; // Allow sign-in to proceed
    },
    async session({ session, token }) {
      // Add user ID to session
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
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

