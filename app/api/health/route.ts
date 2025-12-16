import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

// Use Node.js runtime for Supabase compatibility
export const runtime = 'nodejs';

export async function GET() {
  // During build time, database may not be available - return early
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      status: 'ok',
      database: 'not_available_during_build',
      message: 'Database not available during build time',
    });
  }

  try {
    const supabase = getSupabaseServerClient();
    
    // Test database connection by checking if tables exist
    const { data: listingsData, error: listingsError } = await supabase
      .from('listings')
      .select('id')
      .limit(1);
    
    const { data: helpSeekersData, error: helpSeekersError } = await supabase
      .from('help_seekers')
      .select('id')
      .limit(1);
    
    const hasListings = !listingsError;
    const hasHelpSeekers = !helpSeekersError;
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      tables: {
        listings: hasListings,
        help_seekers: hasHelpSeekers,
      },
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'not configured',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'not configured',
      },
    });
  } catch (error: any) {
    // During build, gracefully handle database errors
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        status: 'ok',
        database: 'not_available_during_build',
        message: 'Database not available during build time',
      });
    }
    
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: error?.message || 'Unknown error',
      errorCode: error?.code,
      hint: 'Check your Supabase configuration in .env file',
    }, { status: 500 });
  }
}
