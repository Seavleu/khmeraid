import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

// Use Node.js runtime for Supabase compatibility
export const runtime = 'nodejs';

// Debug endpoint to check environment and Supabase setup
export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      // Supabase configuration
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseUrlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL 
        ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 50) + '...' 
        : 'NOT SET',
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    supabase: {
      status: 'checking...'
    }
  };

  // Try to test Supabase connection
  try {
    const supabase = getSupabaseServerClient();
    
    // Try a simple query to count listings
    const { count, error } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      throw error;
    }
    
    diagnostics.supabase = {
      status: '✅ Connected',
      listingCount: count || 0,
      clientType: 'server-client'
    };
    
    return NextResponse.json({
      success: true,
      ...diagnostics
    });
  } catch (error: any) {
    diagnostics.supabase = {
      status: '❌ Error',
      error: error?.message || 'Unknown error',
      errorName: error?.name,
      errorCode: error?.code,
      message: error?.message,
    };
    
    return NextResponse.json({
      success: false,
      ...diagnostics
    }, { status: 500 });
  }
}
