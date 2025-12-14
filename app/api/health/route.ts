import { NextResponse } from 'next/server';

export async function GET() {
  // During build time, database may not be available - return early
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL) {
    return NextResponse.json({
      status: 'ok',
      database: 'not_available_during_build',
      message: 'Database not available during build time',
    });
  }

  // Dynamic import to avoid loading Prisma during build
  const { prisma } = await import('@/lib/prisma');
  
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check if tables exist
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('listings', 'help_seekers')
    `;
    
    const hasListings = tables.some((t: { tablename: string }) => t.tablename === 'listings');
    const hasHelpSeekers = tables.some((t: { tablename: string }) => t.tablename === 'help_seekers');
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      tables: {
        listings: hasListings,
        help_seekers: hasHelpSeekers,
      },
      databaseUrlType: process.env.DATABASE_URL?.includes('pooler') 
        ? 'pooler (❌ WRONG - use direct connection)' 
        : process.env.DATABASE_URL?.includes('connect') 
        ? 'direct (✅ CORRECT)' 
        : 'unknown',
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
      databaseUrlType: process.env.DATABASE_URL?.includes('pooler') 
        ? 'pooler (❌ WRONG - use direct connection)' 
        : process.env.DATABASE_URL?.includes('connect') 
        ? 'direct (✅ CORRECT)' 
        : 'unknown',
      hint: process.env.DATABASE_URL?.includes('pooler') 
        ? 'Your DATABASE_URL is using a pooler connection. Prisma needs a direct connection. Use port 5432 and host ending in .connect.supabase.co'
        : 'Check your DATABASE_URL in .env file',
    }, { status: 500 });
  }
}

