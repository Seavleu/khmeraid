import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // During build time, return early
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL) {
    return NextResponse.json({ listings: [], message: 'Not available during build' });
  }

  // Dynamic import to avoid loading Prisma during build
  const { prisma } = await import('@/lib/prisma');

  try {
    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get('sort') || '-created_at';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const area = searchParams.get('area');
    const verified = searchParams.get('verified');

    // Handle sort parameter - remove leading dash and set direction
    const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    const sortDirection = sort.startsWith('-') ? 'desc' as const : 'asc' as const;
    
    // Map created_date to created_at for Prisma
    const prismaSortField = sortField === 'created_date' ? 'created_at' : sortField;
    
    const orderBy = { [prismaSortField]: sortDirection };

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (area) where.area = area;
    if (verified !== null && verified !== undefined) {
      where.verified = verified === 'true';
    }

    const listings = await prisma.listing.findMany({
      where,
      orderBy,
      take: limit,
    });

    // Format listings to match expected format
    const formatted = listings.map((listing: any) => ({
      ...listing,
      created_date: listing.created_at?.toISOString() || new Date().toISOString(),
      updated_date: listing.updated_at?.toISOString() || new Date().toISOString(),
      created_at: listing.created_at?.toISOString(),
      updated_at: listing.updated_at?.toISOString(),
    }));

    return NextResponse.json(formatted, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error: any) {
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

