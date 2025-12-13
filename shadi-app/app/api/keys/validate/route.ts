import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ProxyAgent } from 'undici';

// Create a proxy-aware fetch function
function createProxyFetch() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;
  
  if (!proxyUrl) {
    return fetch;
  }

  const agent = new ProxyAgent(proxyUrl);

  return async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    try {
      const { fetch: undiciFetch } = await import('undici');
      const urlString = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      
      const response = await undiciFetch(urlString, {
        ...init,
        dispatcher: agent,
      } as any);
      // Convert undici Response to standard Response by getting the body as arrayBuffer
      const body = response.body ? await response.arrayBuffer() : null;
      // Convert undici Headers to standard Headers
      const headers = new Headers();
      response.headers.forEach((value, key) => {
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
}

function getSupabaseClient() {
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

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      fetch: proxyFetch,
    },
  });
}

// POST - Validate API key
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'API key is required', valid: false },
        { status: 400 }
      );
    }

    // Query the database to check if the API key exists
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, type, key, usage, limit')
      .eq('key', key)
      .single();

    if (error) {
      // If no rows found, the key is invalid
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { valid: false, message: 'Invalid API key' },
          { status: 200 }
        );
      }
      
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}`, valid: false },
        { status: 500 }
      );
    }

    if (data) {
      return NextResponse.json(
        { valid: true, message: 'Valid API key', keyData: data },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { valid: false, message: 'Invalid API key' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error validating API key:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to validate API key';
    return NextResponse.json(
      { error: errorMessage, valid: false },
      { status: 500 }
    );
  }
}

