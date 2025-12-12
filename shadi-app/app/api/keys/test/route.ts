import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Test endpoint to diagnose connection and table access
export async function GET() {
  const diagnostics: any = {
    envVars: {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
    },
    connection: null,
    tableCheck: null,
    rlsCheck: null,
  };

  try {
    const supabase = getSupabaseClient();
    
    // Test 1: Basic connection
    diagnostics.connection = { status: 'connected' };

    // Test 2: Check if table exists and can be queried
    const { data, error, count } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      diagnostics.tableCheck = {
        exists: false,
        error: error.message,
        code: error.code,
        details: error,
      };
    } else {
      diagnostics.tableCheck = {
        exists: true,
        canRead: true,
        rowCount: count || 0,
      };
    }

    // Test 3: Try to insert a test row (then delete it)
    const testInsert = await supabase
      .from('api_keys')
      .insert([
        {
          name: '__test__',
          type: 'dev',
          key: '__test_key__' + Date.now(),
          usage: 0,
        },
      ])
      .select()
      .single();

    if (testInsert.error) {
      diagnostics.rlsCheck = {
        canInsert: false,
        error: testInsert.error.message,
        code: testInsert.error.code,
        hint: testInsert.error.message.includes('permission') || testInsert.error.message.includes('RLS')
          ? 'RLS policy is blocking insert. Check your Row Level Security policies.'
          : 'Unknown error',
      };
    } else {
      // Delete the test row
      await supabase.from('api_keys').delete().eq('id', testInsert.data.id);
      diagnostics.rlsCheck = {
        canInsert: true,
        canDelete: true,
      };
    }

    return NextResponse.json(diagnostics, { status: 200 });
  } catch (error) {
    diagnostics.error = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(diagnostics, { status: 500 });
  }
}

