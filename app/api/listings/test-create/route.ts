import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

// Use Node.js runtime for Supabase compatibility
export const runtime = 'nodejs';

/**
 * Test endpoint to verify listing creation works
 * POST /api/listings/test-create
 * 
 * Body: {
 *   title: string (required)
 *   area: string (required)
 *   type?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const data = await request.json();

    // Minimal test data
    const testListingData = {
      title: data.title || 'Test Listing',
      area: data.area || 'Test Area',
      type: data.type || null,
      status: 'open',
    };

    const { data: testListing, error } = await supabase
      .from('listings')
      .insert(testListingData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Test listing created successfully',
      listing: {
        id: testListing.id,
        title: testListing.title,
        area: testListing.area,
        created_at: testListing.created_at ? new Date(testListing.created_at).toISOString() : undefined,
      },
    });
  } catch (error: any) {
    console.error('Test create error:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      code: error?.code,
      message: error?.message,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }, { status: 500 });
  }
}
