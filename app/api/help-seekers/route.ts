import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // During build time, return early
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL) {
    return NextResponse.json({ helpSeekers: [], message: 'Not available during build' });
  }

  // Dynamic import to avoid loading Prisma during build
  const { prisma } = await import('@/lib/prisma');

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const help_type = searchParams.get('help_type');
    const urgency = searchParams.get('urgency');
    const share_token = searchParams.get('share_token');

    const where: any = {};
    if (status) where.status = status;
    if (help_type) where.help_type = help_type;
    if (urgency) where.urgency = urgency;
    if (share_token) where.share_token = share_token;

    const helpSeekers = await prisma.helpSeeker.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    // Format help seekers to match expected format
    const formatted = helpSeekers.map((helpSeeker: any) => ({
      ...helpSeeker,
      created_date: helpSeeker.created_at?.toISOString() || new Date().toISOString(),
      updated_date: helpSeeker.updated_at?.toISOString() || new Date().toISOString(),
      created_at: helpSeeker.created_at?.toISOString(),
      updated_at: helpSeeker.updated_at?.toISOString(),
    }));

    return NextResponse.json(formatted, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error: any) {
    console.error('Error fetching help seekers:', error);
    const errorResponse: any = { 
      error: 'Failed to fetch help seekers',
      message: error?.message || 'Unknown error',
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = {
        name: error?.name,
        code: error?.code,
        meta: error?.meta,
        stack: error?.stack?.substring(0,1000),
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlType: process.env.DATABASE_URL?.includes('pooler') ? 'pooler' : process.env.DATABASE_URL?.includes('connect') ? 'direct' : 'unknown'
      };
    }
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // During build time, return early
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL) {
    return NextResponse.json({ message: 'Not available during build' }, { status: 503 });
  }

  // Dynamic import to avoid loading Prisma during build
  const { prisma } = await import('@/lib/prisma');

  try {
    const data = await request.json();

    const helpSeeker = await prisma.helpSeeker.create({
      data: {
        name: data.name,
        phone: data.phone,
        latitude: data.latitude,
        longitude: data.longitude,
        help_type: data.help_type,
        urgency: data.urgency ?? 'medium',
        status: data.status ?? 'active',
        notes: data.notes,
        last_updated: data.last_updated ? new Date(data.last_updated) : new Date(),
        shared_with_contacts: data.shared_with_contacts ?? [],
        share_token: data.share_token,
      },
    });

    return NextResponse.json({
      ...helpSeeker,
      created_date: helpSeeker.created_at?.toISOString() || new Date().toISOString(),
      updated_date: helpSeeker.updated_at?.toISOString() || new Date().toISOString(),
      created_at: helpSeeker.created_at?.toISOString(),
      updated_at: helpSeeker.updated_at?.toISOString(),
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating help seeker:', error);
    return NextResponse.json({ error: 'Failed to create help seeker' }, { status: 500 });
  }
}

