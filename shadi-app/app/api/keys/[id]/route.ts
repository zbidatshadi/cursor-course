import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/api-utils';

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

