import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, getAuthenticatedUserId } from '@/lib/api-utils';

// GET - Fetch all API keys for authenticated user
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getAuthenticatedUserId(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to access your API keys.' },
        { status: 401 }
      );
    }

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
    
    // Fetch API keys filtered by user_id
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, type, key, usage, created_at, limit')
      .eq('user_id', userId)
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
      if (error.code === '42703') {
        return NextResponse.json(
          { 
            error: 'Database column "user_id" does not exist.',
            details: 'Please add the user_id column to the api_keys table. See the migration script in SUPABASE_SETUP.md',
          },
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

    // Add caching headers for GET requests
    return NextResponse.json(data || [], {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    });
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

