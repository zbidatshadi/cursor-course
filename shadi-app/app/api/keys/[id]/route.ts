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

    const { data, error } = await supabase
      .from('api_keys')
      .update(updateData)
      .eq('id', id)
      .select()
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

