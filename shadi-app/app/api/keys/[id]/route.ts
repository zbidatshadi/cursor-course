import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, getAuthenticatedUserId } from '@/lib/api-utils';

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
    // Get authenticated user ID
    const userId = await getAuthenticatedUserId(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to update API keys.' },
        { status: 401 }
      );
    }

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

    // Perform the update with user_id filter to ensure user can only update their own keys
    const { data, error } = await supabase
      .from('api_keys')
      // @ts-ignore - Supabase type inference issue with update
      .update(updateData as any)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, name, type, key, usage, created_at, limit');

    if (error) {
      console.error('Supabase error:', error);
      // Handle the PGRST116 error specifically
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'API key not found or you do not have permission to update it' },
          { status: 404 }
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
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.error('Update returned no rows - likely user does not own this key or row does not exist');
      return NextResponse.json(
        { error: 'API key not found or you do not have permission to update it' },
        { status: 404 }
      );
    }

    return NextResponse.json(data[0]);
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
    // Get authenticated user ID
    const userId = await getAuthenticatedUserId(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to delete API keys.' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing API key ID' },
        { status: 400 }
      );
    }

    // Delete with user_id filter to ensure user can only delete their own keys
    const { data, error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id');

    if (error) {
      console.error('Supabase error:', error);
      if (error.code === '42703') {
        return NextResponse.json(
          { 
            error: 'Database column "user_id" does not exist.',
            details: 'Please add the user_id column to the api_keys table. See the migration script in SUPABASE_SETUP.md',
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    // Check if any rows were deleted
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'API key not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete API key';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

