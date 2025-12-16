import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

// Use Node.js runtime for Supabase compatibility
export const runtime = 'nodejs';

// Simple test endpoint to verify database connection and data fetching
export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    
    // Test 1: Check connection by counting listings
    const { count: listingCount, error: countError } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      throw countError;
    }
    
    // Test 2: Fetch a few listings
    const { data: sampleListings, error: listingsError } = await supabase
      .from('listings')
      .select('id, title, type, area, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (listingsError) {
      throw listingsError;
    }
    
    // Test 3: Count help seekers
    const { count: helpSeekerCount, error: helpSeekersError } = await supabase
      .from('help_seekers')
      .select('*', { count: 'exact', head: true });
    
    if (helpSeekersError) {
      throw helpSeekersError;
    }
    
    return NextResponse.json({
      success: true,
      connection: 'ok',
      counts: {
        listings: listingCount || 0,
        helpSeekers: helpSeekerCount || 0,
      },
      sampleListings: (sampleListings || []).map((l: any) => ({
        ...l,
        created_at: l.created_at ? new Date(l.created_at).toISOString() : undefined,
      })),
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseUrlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50) + '...',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      details: {
        name: error?.name,
        code: error?.code,
        message: error?.message,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
