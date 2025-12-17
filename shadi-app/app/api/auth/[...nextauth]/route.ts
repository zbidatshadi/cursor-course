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
import { createClient } from '@supabase/supabase-js';
import { ProxyAgent } from 'undici';
import { randomUUID } from 'node:crypto';

// Cache undici import to avoid dynamic import overhead
let undiciFetch: any = null;
const getUndiciFetch = async () => {
  if (!undiciFetch) {
    const undici = await import('undici');
    undiciFetch = undici.fetch;
  }
  return undiciFetch;
};

// Cache proxy fetch function
let cachedProxyFetch: ((url: string | URL | Request, init?: RequestInit) => Promise<Response>) | null = null;

function createProxyFetch() {
  if (cachedProxyFetch) {
    return cachedProxyFetch;
  }

  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;
  
  if (!proxyUrl) {
    cachedProxyFetch = fetch;
    return cachedProxyFetch;
  }

  const agent = new ProxyAgent(proxyUrl);

  cachedProxyFetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    try {
      const fetchFn = await getUndiciFetch();
      let urlString: string;
  if (typeof url === 'string') {
    urlString = url;
  } else if (url instanceof URL) {
    urlString = url.toString();
  } else {
    urlString = (url as Request).url;
  }
      
      const response = await fetchFn(urlString, {
        ...init,
        dispatcher: agent,
      } as any);
      const body = response.body ? await response.arrayBuffer() : null;
      const headers = new Headers();
      response.headers.forEach((value: string, key: string) => {
        headers.set(key, value);
      });
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
      });
    } catch (error: any) {
      if (error.code === 'ENOTFOUND' || error.message?.includes('getaddrinfo')) {
        throw new Error(
          `DNS resolution failed. The proxy (${proxyUrl}) should handle this via CONNECT method. ` +
          `This might indicate a proxy configuration issue. Original error: ${error.message}`
        );
      }
      throw error;
    }
  };
  
  return cachedProxyFetch;
}

// Cache Supabase client
let cachedSupabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (cachedSupabaseClient) {
    return cachedSupabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
  }

  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`);
  }

  const proxyFetch = createProxyFetch();

  cachedSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      fetch: proxyFetch,
    },
  });

  return cachedSupabaseClient;
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
      // After sign in, redirect to dashboard
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/dashboard`;
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

