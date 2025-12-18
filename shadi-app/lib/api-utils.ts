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

  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;
  
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
      const urlString = typeof url === 'string' ? url : url instanceof URL ? url.toString() : (url as Request).url;
      
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
        throw new Error(
          `Redirect loop detected when fetching ${typeof url === 'string' ? url : (url as Request).url}. ` +
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

