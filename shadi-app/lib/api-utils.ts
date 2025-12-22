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

/**
 * Check if API key has exceeded its rate limit
 * @param supabase - Supabase client instance
 * @param apiKey - The API key string
 * @returns Object with isRateLimited (boolean) and current usage data, or error response
 */
export async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  apiKey: string
): Promise<{ isRateLimited: boolean; usage: number; limit: number | null; keyId: string } | { error: string; status: number }> {
  try {
    // Fetch API key with usage and limit
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, usage, limit')
      .eq('key', apiKey)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[RateLimit] API key not found in database');
        return { error: 'Invalid API key', status: 401 };
      }
      console.error('[RateLimit] Error fetching API key:', error.message);
      return { error: 'Database error', status: 500 };
    }

    if (!data) {
      console.log('[RateLimit] No data returned for API key');
      return { error: 'Invalid API key', status: 401 };
    }

    const apiKeyData = data as { id: string; usage: number | null; limit: number | null };
    const usage = apiKeyData.usage || 0;
    const limit = apiKeyData.limit;
    const keyId = apiKeyData.id;

    // If limit is null, there's no rate limit (unlimited)
    if (limit === null) {
      return { isRateLimited: false, usage, limit: null, keyId };
    }

    // Check if usage has reached or exceeded the limit
    const isRateLimited = usage >= limit;
    return { isRateLimited, usage, limit, keyId };
  } catch (error) {
    console.error('[RateLimit] Unexpected error:', error);
    if (error instanceof Error) {
      console.error('[RateLimit] Error message:', error.message);
      console.error('[RateLimit] Error stack:', error.stack);
    }
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Increment the usage count for an API key
 * @param supabase - Supabase client instance
 * @param keyId - The API key ID (UUID)
 * @returns Success boolean or error response
 */
export async function incrementApiKeyUsage(
  supabase: ReturnType<typeof createClient>,
  keyId: string
): Promise<{ success: boolean } | { error: string; status: number }> {
  try {
    // First, get current usage to increment it
    const { data: currentData, error: fetchError } = await supabase
      .from('api_keys')
      .select('usage, key')
      .eq('id', keyId)
      .single();

    if (fetchError) {
      console.error('[RateLimit] Error fetching current usage:', fetchError.message);
      return { error: 'Failed to fetch API key usage', status: 500 };
    }

    if (!currentData) {
      console.error('[RateLimit] No data returned for key ID:', keyId);
      return { error: 'API key not found', status: 404 };
    }

    const usageData = currentData as { usage: number | null; key: string };
    const currentUsage = usageData.usage || 0;
    const newUsage = currentUsage + 1;

    // Update usage atomically
    const { data: updateData, error: updateError } = await supabase
      .from('api_keys')
      // @ts-ignore - Supabase type inference issue with update
      .update({ 
        usage: newUsage,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', keyId)
      .select('id, usage');

    if (updateError) {
      console.error('[RateLimit] Error incrementing usage:', updateError.message);
      return { error: 'Failed to increment API key usage', status: 500 };
    }

    if (updateData && updateData.length > 0) {
      return { success: true };
    } else {
      console.error('[RateLimit] Update succeeded but no data returned');
      return { error: 'Update succeeded but verification failed', status: 500 };
    }
  } catch (error) {
    console.error('[RateLimit] Unexpected error incrementing usage:', error);
    if (error instanceof Error) {
      console.error('[RateLimit] Error message:', error.message);
      console.error('[RateLimit] Error stack:', error.stack);
    }
    return { error: 'Internal server error', status: 500 };
  }
}

