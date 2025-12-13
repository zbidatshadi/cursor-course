import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ProxyAgent } from 'undici';

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
let cachedProxyFetch: ((url: string | URL | Request, init?: RequestInit) => Promise<Response>) | null = null;

// Create a proxy-aware fetch function
function createProxyFetch() {
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
      const urlString = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      
      const response = await fetchFn(urlString, {
        ...init,
        dispatcher: agent,
      } as any);
      // Convert undici Response to standard Response by getting the body as arrayBuffer
      const body = response.body ? await response.arrayBuffer() : null;
      // Convert undici Headers to standard Headers
      const headers = new Headers();
      // @ts-ignore - undici headers type compatibility
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

// Cache Supabase client to avoid recreating it on every request
let cachedSupabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
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

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

// PUT - Update an API key
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing API key ID' },
        { status: 400 }
      );
    }
    const body = await request.json();
    const { name, type, key } = body;

    console.log('PUT request received:', { id, name, type, key });

    if (!name || !type || !key) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, key' },
        { status: 400 }
      );
    }

    // Validate type
    if (type !== 'dev' && type !== 'prod') {
      return NextResponse.json(
        { error: 'Type must be either "dev" or "prod"' },
        { status: 400 }
      );
    }

    const updateData = {
      name,
      type,
      key,
      updated_at: new Date().toISOString(),
    };

    console.log('Updating with data:', updateData);

    // Optimize update: select only needed columns
    const { data, error } = await supabase
      .from('api_keys')
      // @ts-ignore - Supabase type inference issue with update
      .update(updateData as any)
      .eq('id', id)
      .select('id, name, type, key, usage, created_at, limit')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating API key:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update API key';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE - Delete an API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing API key ID' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('api_keys').delete().eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete API key';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

