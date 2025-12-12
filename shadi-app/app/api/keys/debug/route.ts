import { NextResponse } from 'next/server';

// Debug endpoint to check environment variables and test Supabase connection
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const debug = {
    envCheck: {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET',
      keyLength: supabaseAnonKey?.length || 0,
    },
    connectionTest: null as any,
  };

  // Test direct connection to Supabase
  if (supabaseUrl && supabaseAnonKey) {
    try {
      // Test if we can reach the Supabase REST endpoint
      const testUrl = `${supabaseUrl}/rest/v1/`;
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });

      debug.connectionTest = {
        url: testUrl,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error: any) {
      debug.connectionTest = {
        error: error.message,
        code: error.code,
        errno: error.errno,
        syscall: error.syscall,
        hostname: error.hostname,
        stack: error.stack,
      };
    }
  }

  return NextResponse.json(debug, { status: 200 });
}

