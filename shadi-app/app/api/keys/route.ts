import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ProxyAgent } from 'undici';

// Create a proxy-aware fetch function
function createProxyFetch() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;
  
  if (!proxyUrl) {
    // No proxy, use default fetch
    return fetch;
  }

  // Create a ProxyAgent for undici - this should handle CONNECT and bypass DNS
  const agent = new ProxyAgent(proxyUrl);

  // Return a custom fetch that uses the proxy agent
  // The ProxyAgent should use HTTP CONNECT which doesn't require DNS resolution
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
      // If there's still a DNS error, it means the proxy isn't working as expected
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

  // Validate URL format
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

// GET - Fetch all API keys
export async function GET() {
  try {
    // Check environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
      });
      return NextResponse.json(
        { 
          error: 'Missing Supabase environment variables',
          details: 'Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.',
        },
        { status: 500 }
      );
    }

    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (clientError: any) {
      console.error('Failed to create Supabase client:', clientError);
      return NextResponse.json(
        { 
          error: 'Failed to initialize Supabase client',
          details: clientError.message,
        },
        { status: 500 }
      );
    }
    
    // Add timeout and better error handling for the Supabase query
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      
      // Provide more specific error messages
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'Database table "api_keys" does not exist. Please run the SQL script from SUPABASE_SETUP.md' },
          { status: 500 }
        );
      }
      if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('RLS') || error.message.includes('policy')) {
        return NextResponse.json(
          { 
            error: 'Permission denied by Row Level Security (RLS).',
            details: 'Please check your RLS policies in Supabase. The table exists but access is blocked.',
            hint: 'Go to Authentication > Policies in Supabase and ensure there is a policy allowing SELECT operations.',
            code: error.code,
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { 
          error: `Database error: ${error.message}`,
          code: error.code || 'unknown',
          details: error.details,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    
    // Handle different types of errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const errorStr = error.message || String(error);
      
      // Check for DNS/connection errors
      if (errorStr.includes('ENOTFOUND') || errorStr.includes('getaddrinfo')) {
        return NextResponse.json(
          { 
            error: 'Cannot connect to Supabase: DNS lookup failed',
            details: 'The Supabase project URL cannot be resolved. This usually means:',
            possibleCauses: [
              '1. Your Supabase project is paused (free tier projects pause after 7 days of inactivity)',
              '2. The project URL is incorrect',
              '3. Network/DNS connectivity issues',
            ],
            solution: 'Go to https://supabase.com/dashboard and check if your project needs to be restored/resumed.',
            originalError: errorStr,
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Network error: Unable to connect to Supabase',
          details: 'This could be due to network issues or incorrect Supabase URL. Please check your NEXT_PUBLIC_SUPABASE_URL in .env.local',
          originalError: error.message,
        },
        { status: 500 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch API keys';
    return NextResponse.json(
      { 
        error: errorMessage,
        type: error instanceof Error ? error.constructor.name : 'Unknown',
      },
      { status: 500 }
    );
  }
}

// POST - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { name, type, key, limit } = body;

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

    const { data, error } = await supabase
      .from('api_keys')
      .insert([
        {
          name,
          type,
          key,
          usage: 0,
          limit: limit || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      // Provide more specific error messages
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'An API key with this value already exists' },
          { status: 409 }
        );
      }
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'Database table "api_keys" does not exist. Please run the SQL script from SUPABASE_SETUP.md' },
          { status: 500 }
        );
      }
      if (error.message.includes('permission denied') || error.message.includes('RLS')) {
        return NextResponse.json(
          { error: 'Permission denied. Please check your Row Level Security (RLS) policies in Supabase.' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating API key:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create API key';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

