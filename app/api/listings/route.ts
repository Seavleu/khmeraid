import { NextRequest, NextResponse } from 'next/server';
import { writeFile, appendFile } from 'fs/promises';
import { join } from 'path';

async function logDebug(data: any) {
  // Only log in development mode
  if (process.env.NODE_ENV !== 'development') return;
  
  try {
    const logPath = join(process.cwd(), '.cursor', 'debug.log');
    const logEntry = JSON.stringify({...data, timestamp: Date.now()}) + '\n';
    await appendFile(logPath, logEntry, 'utf8').catch(() => {
      // Try to create file if it doesn't exist
      writeFile(logPath, logEntry, 'utf8').catch(() => {});
    });
  } catch (e) {
    // Fallback to console in development
    console.log('[DEBUG]', data);
  }
}

export async function GET(request: NextRequest) {
  // During build time, return early
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL) {
    return NextResponse.json({ listings: [], message: 'Not available during build' });
  }

  // Dynamic import to avoid loading Prisma during build
  const { prisma } = await import('@/lib/prisma');

  // #region agent log
  await logDebug({location:'app/api/listings/route.ts:11',message:'GET listings API called',data:{hasPrisma:!!prisma,hasDatabaseUrl:!!process.env.DATABASE_URL},sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
  // #endregion
  try {
    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get('sort') || '-created_at';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const area = searchParams.get('area');
    const verified = searchParams.get('verified');

    // #region agent log
    await logDebug({location:'app/api/listings/route.ts:20',message:'Query params parsed',data:{sort,limit,status,type,area,verified},sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
    // #endregion

    // Handle sort parameter - remove leading dash and set direction
    const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    const sortDirection = sort.startsWith('-') ? 'desc' as const : 'asc' as const;
    
    // Map created_date to created_at for Prisma
    const prismaSortField = sortField === 'created_date' ? 'created_at' : sortField;
    
    const orderBy = { [prismaSortField]: sortDirection };

    // #region agent log
    await logDebug({location:'app/api/listings/route.ts:25',message:'orderBy constructed',data:{orderBy},sessionId:'debug-session',runId:'run1',hypothesisId:'C'});
    // #endregion

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (area) where.area = area;
    if (verified !== null && verified !== undefined) {
      where.verified = verified === 'true';
    }

    // #region agent log
    await logDebug({location:'app/api/listings/route.ts:33',message:'Before Prisma query',data:{where,orderBy,limit},sessionId:'debug-session',runId:'run1',hypothesisId:'D'});
    // #endregion

    let listings;
    try {
      listings = await prisma.listing.findMany({
        where,
        orderBy,
        take: limit,
      });
    } catch (prismaError: any) {
      // #region agent log
      await logDebug({location:'app/api/listings/route.ts:62',message:'Prisma query failed',data:{errorMessage:prismaError?.message,errorCode:prismaError?.code,errorName:prismaError?.name},sessionId:'debug-session',runId:'run1',hypothesisId:'G'});
      // #endregion
      throw prismaError;
    }

    // #region agent log
    await logDebug({location:'app/api/listings/route.ts:44',message:'Prisma query succeeded',data:{count:listings.length},sessionId:'debug-session',runId:'run1',hypothesisId:'E'});
    // #endregion

    // Format listings to match expected format
    const formatted = listings.map(listing => ({
      ...listing,
      created_date: listing.created_at?.toISOString() || new Date().toISOString(),
      updated_date: listing.updated_at?.toISOString() || new Date().toISOString(),
      created_at: listing.created_at?.toISOString(),
      updated_at: listing.updated_at?.toISOString(),
    }));

    return NextResponse.json(formatted, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    // #region agent log
    await logDebug({location:'app/api/listings/route.ts:72',message:'Error caught in listings API',data:{errorMessage:error?.message,errorName:error?.name,errorCode:error?.code,errorMeta:error?.meta,errorStack:error?.stack?.substring(0,500),hasDatabaseUrl:!!process.env.DATABASE_URL,databaseUrlPrefix:process.env.DATABASE_URL?.substring(0,30)},sessionId:'debug-session',runId:'run1',hypothesisId:'F'});
    // #endregion
    console.error('Error fetching listings:', error);
    const errorResponse: any = { 
      error: 'Failed to fetch listings',
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

    const listing = await prisma.listing.create({
      data: {
        title: data.title,
        type: data.type,
        area: data.area,
        exact_location: data.exact_location,
        location_consent: data.location_consent ?? false,
        latitude: data.latitude,
        longitude: data.longitude,
        capacity_min: data.capacity_min,
        capacity_max: data.capacity_max,
        status: data.status ?? 'open',
        family_friendly: data.family_friendly ?? false,
        notes: data.notes,
        contact_name: data.contact_name,
        contact_phone: data.contact_phone,
        facebook_contact: data.facebook_contact,
        image_url: data.image_url,
        reference_link: data.reference_link,
        google_maps_link: data.google_maps_link,
        duration_days: data.duration_days,
        expires_at: data.expires_at ? new Date(data.expires_at) : null,
        verified: data.verified ?? false,
        opening_hours: data.opening_hours,
        services_offered: data.services_offered ?? [],
        average_rating: data.average_rating,
        review_count: data.review_count ?? 0,
        event_date: data.event_date ? new Date(data.event_date) : null,
        event_time: data.event_time,
        event_end_date: data.event_end_date ? new Date(data.event_end_date) : null,
        organizer_name: data.organizer_name,
        organizer_contact: data.organizer_contact,
      },
    });

    return NextResponse.json({
      ...listing,
      created_date: listing.created_at?.toISOString() || new Date().toISOString(),
      updated_date: listing.updated_at?.toISOString() || new Date().toISOString(),
      created_at: listing.created_at?.toISOString(),
      updated_at: listing.updated_at?.toISOString(),
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}

