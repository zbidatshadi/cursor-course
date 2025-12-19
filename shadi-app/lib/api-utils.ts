import { createClient } from '@supabase/supabase-js';
import { ProxyAgent } from 'undici';

// Type alias for fetch function
export type ProxyFetchFunction = (url: string | URL | Request, init?: RequestInit) => Promise<Response>;

// Cache undici import to avoid dynamic import overhead
let undiciFetch: any = null;
const getUndiciFetch = async () => {
  if (!undiciFetch) {
    const undici = await import('undici');
    undiciFetch = undici.fetch;
  }
  return undiciFetch;
};

// Cache proxy fetch function to avoid recreating it on every request
let cachedProxyFetch: ProxyFetchFunction | null = null;

/**
 * Create a proxy-aware fetch function that uses undici ProxyAgent
 * This handles CONNECT method and bypasses DNS resolution issues
 */
export function createProxyFetch(): ProxyFetchFunction {
  // Return cached version if available
  if (cachedProxyFetch) {
    return cachedProxyFetch;
  }

  let proxyUrl: string | undefined;
  if (process.env.HTTPS_PROXY) {
    proxyUrl = process.env.HTTPS_PROXY;
  } else if (process.env.HTTP_PROXY) {
    proxyUrl = process.env.HTTP_PROXY;
  } else if (process.env.https_proxy) {
    proxyUrl = process.env.https_proxy;
  } else if (process.env.http_proxy) {
    proxyUrl = process.env.http_proxy;
  }
  
  if (!proxyUrl) {
    // No proxy, use default fetch
    cachedProxyFetch = fetch;
    return cachedProxyFetch;
  }

  // Create a ProxyAgent for undici - this should handle CONNECT and bypass DNS
  const agent = new ProxyAgent(proxyUrl);

  // Return a custom fetch that uses the proxy agent
  cachedProxyFetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    try {
      const fetchFn = await getUndiciFetch();
      let urlString: string;
      if (typeof url === 'string') {
        urlString = url;
      } else if (url instanceof URL) {
        urlString = url.toString();
      } else {
        urlString = url.url;
      }
      
      const response = await fetchFn(urlString, {
        ...init,
        dispatcher: agent,
        redirect: 'follow',
        maxRedirections: 3,
      } as any);
      
      // Convert undici Response to standard Response by getting the body as arrayBuffer
      const body = response.body ? await response.arrayBuffer() : null;
      
      // Convert undici Headers to standard Headers
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
      // Handle redirect loop errors
      if (error.message?.includes('maxRedirects') || error.message?.includes('redirect loop')) {
        let errorUrl: string;
        if (typeof url === 'string') {
          errorUrl = url;
        } else if (url instanceof URL) {
          errorUrl = url.toString();
        } else {
          errorUrl = url.url;
        }
        throw new Error(
          `Redirect loop detected when fetching ${errorUrl}. ` +
          `This may be caused by proxy configuration or the target URL. Original error: ${error.message}`
        );
      }
      
      // Handle DNS errors
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

// Cache Supabase client to avoid recreating it on every request
let cachedSupabaseClient: ReturnType<typeof createClient> | null = null;

/**
 * Get a Supabase client instance with proxy support
 * The client is cached and reused across requests
 */
export function getSupabaseClient() {
  // Return cached client if available
  if (cachedSupabaseClient) {
    return cachedSupabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
  }

  // Validate URL format
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

/**
 * Helper function to add timeout to promises
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * CORS headers helper for API routes
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
};

/**
 * Get authenticated user ID from NextAuth session
 * Returns the user ID from Supabase by looking up the email from JWT
 * @param request - NextRequest object (required for App Router)
 */
export async function getAuthenticatedUserId(request: { headers: Headers }): Promise<string | null> {
  try {
    const nextAuthJwt = await import('next-auth/jwt');
    const { authOptions } = await import('@/app/api/auth/[...nextauth]/route');
    const { decode } = nextAuthJwt;
    
    // Get cookies from request headers
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Log for debugging
    if (!cookieHeader) {
      console.log('[Auth] No cookies found in request headers');
      return null;
    }
    
    console.log('[Auth] Cookie header received, length:', cookieHeader.length);
    
    // Parse cookies to see what we have
    const cookies: Record<string, string> = {};
    cookieHeader.split(';').forEach(cookie => {
      const [key, ...valueParts] = cookie.trim().split('=');
      if (key && valueParts.length > 0) {
        cookies[key] = decodeURIComponent(valueParts.join('='));
      }
    });
    
    // Check for NextAuth session cookies
    const hasNextAuthCookie = Object.keys(cookies).some(key => 
      key.includes('next-auth') || key.includes('authjs')
    );
    
    console.log('[Auth] Cookie keys found:', Object.keys(cookies));
    console.log('[Auth] Has NextAuth cookie:', hasNextAuthCookie);
    
    if (!hasNextAuthCookie) {
      console.log('[Auth] No NextAuth session cookie found. User may not be signed in.');
      console.log('[Auth] Available cookies:', Object.keys(cookies).join(', '));
      return null;
    }
    
    // Get secret - must match exactly what's in authOptions
    const secret = authOptions.secret || process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'development-secret-change-in-production');
    if (!secret) {
      console.error('[Auth] NEXTAUTH_SECRET is not set and no fallback available');
      return null;
    }
    
    console.log('[Auth] Attempting to decode session token...');
    
    try {
      // Get the session token from cookies
      const sessionToken = cookies['next-auth.session-token'] || cookies['__Secure-next-auth.session-token'];
      
      if (!sessionToken) {
        console.log('[Auth] No session token found in cookies');
        return null;
      }
      
      console.log('[Auth] Session token found, attempting to decode...');
      
      // Use decode to decrypt the encrypted JWT token
      const token = await decode({
        token: sessionToken,
        secret: secret,
      });
      
      if (!token) {
        console.log('[Auth] Failed to decode token');
        return null;
      }
      
      console.log('[Auth] ✓ Token decoded successfully!');
      console.log('[Auth] Token found, keys:', Object.keys(token));
      console.log('[Auth] Token sub (user ID):', token.sub);
      
      // Get email from token
      const email = token.email;
      
      if (!email) {
        console.log('[Auth] Token found but no email. Token keys:', Object.keys(token));
        console.log('[Auth] User may need to sign out and sign in again to get email in token');
        return null;
      }

      console.log('[Auth] Email from token:', email);

      // Look up user in Supabase by email
      const supabase = getSupabaseClient();
      const { data: user, error } = await (supabase
        .from('users' as any)
        .select('id')
        .eq('email', email)
        .maybeSingle()) as { data: any; error: any };

      if (error) {
        console.error('[Auth] Error looking up user in Supabase:', error);
        return null;
      }

      if (!user) {
        console.log('[Auth] User not found in Supabase for email:', email);
        console.log('[Auth] This means the user was not created during sign-in. They need to sign in again.');
        return null;
      }

      console.log('[Auth] Successfully authenticated user:', user.id);
      return user.id;
    } catch (error) {
      console.error('[Auth] Error decoding token:', error);
      if (error instanceof Error) {
        console.error('[Auth] Error message:', error.message);
        console.error('[Auth] Error stack:', error.stack);
      }
      return null;
    }
  } catch (error) {
    console.error('[Auth] Error getting authenticated user:', error);
    if (error instanceof Error) {
      console.error('[Auth] Error details:', error.message, error.stack);
    }
    return null;
  }
}

