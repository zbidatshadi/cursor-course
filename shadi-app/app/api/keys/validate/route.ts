import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, corsHeaders } from '@/lib/api-utils';

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
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
        { status: 400, headers: corsHeaders }
      );
    }

    // Query the database to check if the API key exists
    // Optimize: select only needed columns
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
          { status: 200, headers: corsHeaders }
        );
      }
      
      // Handle RLS/permission errors
      if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('RLS') || error.message.includes('policy')) {
        console.error('Supabase RLS error:', error);
        return NextResponse.json(
          { 
            error: 'Permission denied by Row Level Security (RLS).',
            details: 'Please check your RLS policies in Supabase. The table exists but access is blocked.',
            hint: 'Go to Authentication > Policies in Supabase and ensure there is a policy allowing SELECT operations on api_keys table.',
            code: error.code,
            valid: false
          },
          { status: 403, headers: corsHeaders }
        );
      }
      
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}`, valid: false },
        { status: 500, headers: corsHeaders }
      );
    }

    if (data) {
      return NextResponse.json(
        { valid: true, message: 'Valid API key', keyData: data },
        { status: 200, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { valid: false, message: 'Invalid API key' },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error validating API key:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to validate API key';
    return NextResponse.json(
      { error: errorMessage, valid: false },
      { status: 500, headers: corsHeaders }
    );
  }
}

