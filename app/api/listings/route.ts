import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { randomUUID } from 'crypto';

// Use Node.js runtime for Supabase compatibility (Edge runtime doesn't support all Node.js APIs)
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // During build time, return early
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ listings: [], message: 'Not available during build' });
  }

  try {
    const supabase = getSupabaseServerClient();
    const searchParams = request.nextUrl.searchParams;
    const testMode = searchParams.get('test') === 'true';
    const sort = searchParams.get('sort') || '-created_at';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const area = searchParams.get('area');
    const verified = searchParams.get('verified');

    // Handle sort parameter - remove leading dash and set direction
    const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    const sortDirection = sort.startsWith('-') ? 'desc' : 'asc';
    
    // Map created_date to created_at for Supabase
    const supabaseSortField = sortField === 'created_date' ? 'created_at' : sortField;

    // Build Supabase query
    let query = supabase
      .from('listings')
      .select('*');

    // Apply filters
    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);
    if (area) query = query.eq('area', area);
    if (verified !== null && verified !== undefined) {
      query = query.eq('verified', verified === 'true');
    }

    // Apply sorting
    query = query.order(supabaseSortField, { ascending: sortDirection === 'asc' });

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const { data: listings, error, count } = await query;

    if (error) {
      throw error;
    }

    // Format listings to match expected format
    const formatted = (listings || []).map((listing: any) => ({
      ...listing,
      created_date: listing.created_at ? new Date(listing.created_at).toISOString() : new Date().toISOString(),
      updated_date: listing.updated_at ? new Date(listing.updated_at).toISOString() : new Date().toISOString(),
      created_at: listing.created_at ? new Date(listing.created_at).toISOString() : undefined,
      updated_at: listing.updated_at ? new Date(listing.updated_at).toISOString() : undefined,
    }));

    // Test mode: return with summary info
    if (testMode) {
      // Get total count
      const { count: totalCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true });

      return NextResponse.json({
        success: true,
        count: formatted.length,
        total_in_db: totalCount || 0,
        timestamp: new Date().toISOString(),
        filters_applied: {
          type: searchParams.get('type'),
          status: searchParams.get('status'),
          area: searchParams.get('area'),
          limit: limit
        },
        listings: formatted
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      });
    }

    // Normal mode: return formatted listings
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
        message: error?.message,
        stack: error?.stack?.substring(0,1000),
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      };
    }
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // During build time, return early
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ message: 'Not available during build' }, { status: 503 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const data = await request.json();

    // Validate required fields according to JSON schema
    if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
      return NextResponse.json(
        { error: 'Validation error', message: 'Title is required' },
        { status: 400 }
      );
    }

    if (!data.type || typeof data.type !== 'string' || data.type.trim() === '') {
      return NextResponse.json(
        { error: 'Validation error', message: 'Type is required' },
        { status: 400 }
      );
    }

    // Validate type enum values
    const validTypes = ['accommodation', 'fuel_service', 'volunteer_request', 'car_transportation', 'site_sponsor', 'school', 'event', 'medical_care'];
    if (!validTypes.includes(data.type)) {
      return NextResponse.json(
        { error: 'Validation error', message: `Type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (!data.area || typeof data.area !== 'string' || data.area.trim() === '') {
      return NextResponse.json(
        { error: 'Validation error', message: 'Area is required' },
        { status: 400 }
      );
    }

    if (!data.status) {
      data.status = 'open'; // Default value from JSON schema
    }

    // Validate status enum values
    const validStatuses = ['open', 'limited', 'full', 'paused'];
    if (!validStatuses.includes(data.status)) {
      return NextResponse.json(
        { error: 'Validation error', message: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Helper function to safely convert to number or null
    const toIntOrNull = (value: any): number | null => {
      if (value === null || value === undefined || value === '') return null;
      const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
      return isNaN(num) ? null : num;
    };

    // Helper function to safely convert to float or null
    const toFloatOrNull = (value: any): number | null => {
      if (value === null || value === undefined || value === '') return null;
      const num = typeof value === 'string' ? parseFloat(value) : Number(value);
      return isNaN(num) ? null : num;
    };

    // Helper function to safely convert date
    const toDateOrNull = (value: any): string | null => {
      if (!value) return null;
      try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date.toISOString();
      } catch {
        return null;
      }
    };

    // Prepare data with proper type conversions
    // Explicitly exclude auto-generated timestamp fields, but generate ID if needed
    const { created_at, updated_at, created_date, updated_date, ...dataWithoutAutoFields } = data;
    
    // Generate UUID for id if not provided (since Supabase table doesn't have default value)
    const listingId = data.id || randomUUID();
    
    // Set timestamps for created_at and updated_at
    const now = new Date().toISOString();
    
    const listingData = {
      id: listingId,
      created_at: now,
      updated_at: now,
      title: dataWithoutAutoFields.title.trim(),
      type: dataWithoutAutoFields.type.trim(),
      area: dataWithoutAutoFields.area.trim(),
      exact_location: dataWithoutAutoFields.exact_location || null,
      location_consent: Boolean(dataWithoutAutoFields.location_consent),
      latitude: toFloatOrNull(dataWithoutAutoFields.latitude),
      longitude: toFloatOrNull(dataWithoutAutoFields.longitude),
      capacity_min: toIntOrNull(dataWithoutAutoFields.capacity_min),
      capacity_max: toIntOrNull(dataWithoutAutoFields.capacity_max),
      status: dataWithoutAutoFields.status || 'open',
      family_friendly: Boolean(dataWithoutAutoFields.family_friendly),
      // Accessibility fields
      wheelchair_accessible: Boolean(dataWithoutAutoFields.wheelchair_accessible),
      accessible_parking: Boolean(dataWithoutAutoFields.accessible_parking),
      accessible_restrooms: Boolean(dataWithoutAutoFields.accessible_restrooms),
      accessible_entrance: Boolean(dataWithoutAutoFields.accessible_entrance),
      elevator_available: Boolean(dataWithoutAutoFields.elevator_available),
      ramp_available: Boolean(dataWithoutAutoFields.ramp_available),
      sign_language_available: Boolean(dataWithoutAutoFields.sign_language_available),
      braille_available: Boolean(dataWithoutAutoFields.braille_available),
      hearing_loop_available: Boolean(dataWithoutAutoFields.hearing_loop_available),
      // Medical care fields
      medical_specialties: Array.isArray(dataWithoutAutoFields.medical_specialties) ? dataWithoutAutoFields.medical_specialties : [],
      emergency_services: Boolean(dataWithoutAutoFields.emergency_services),
      hours_24: Boolean(dataWithoutAutoFields.hours_24),
      insurance_accepted: Boolean(dataWithoutAutoFields.insurance_accepted),
      notes: dataWithoutAutoFields.notes || null,
      contact_name: dataWithoutAutoFields.contact_name || null,
      contact_phone: dataWithoutAutoFields.contact_phone || null,
      facebook_contact: dataWithoutAutoFields.facebook_contact || null,
      image_url: dataWithoutAutoFields.image_url || null,
      reference_link: dataWithoutAutoFields.reference_link || null,
      google_maps_link: dataWithoutAutoFields.google_maps_link || null,
      duration_days: toIntOrNull(dataWithoutAutoFields.duration_days),
      expires_at: toDateOrNull(dataWithoutAutoFields.expires_at),
      verified: Boolean(dataWithoutAutoFields.verified),
      opening_hours: dataWithoutAutoFields.opening_hours || null,
      services_offered: Array.isArray(dataWithoutAutoFields.services_offered) ? dataWithoutAutoFields.services_offered : [],
      average_rating: toFloatOrNull(dataWithoutAutoFields.average_rating),
      review_count: toIntOrNull(dataWithoutAutoFields.review_count) ?? 0,
      event_date: toDateOrNull(dataWithoutAutoFields.event_date),
      event_time: dataWithoutAutoFields.event_time || null,
      event_end_date: toDateOrNull(dataWithoutAutoFields.event_end_date),
      organizer_name: dataWithoutAutoFields.organizer_name || null,
      organizer_contact: dataWithoutAutoFields.organizer_contact || null,
    };

    // Remove any undefined values to prevent issues
    const cleanListingData = Object.fromEntries(
      Object.entries(listingData).filter(([_, value]) => value !== undefined)
    ) as typeof listingData;

    // Log the data being inserted (without sensitive info)
    console.log('Creating listing with data:', {
      title: cleanListingData.title,
      type: cleanListingData.type,
      area: cleanListingData.area,
      hasLocation: !!(cleanListingData.latitude && cleanListingData.longitude),
      hasExactLocation: !!cleanListingData.exact_location,
      locationConsent: cleanListingData.location_consent
    });

    const { data: listing, error } = await supabase
      .from('listings')
      .insert(cleanListingData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating listing:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    if (!listing) {
      console.error('No listing returned from Supabase insert');
      throw new Error('Failed to create listing: No data returned');
    }

    return NextResponse.json({
      ...listing,
      created_date: listing.created_at ? new Date(listing.created_at).toISOString() : new Date().toISOString(),
      updated_date: listing.updated_at ? new Date(listing.updated_at).toISOString() : new Date().toISOString(),
      created_at: listing.created_at ? new Date(listing.created_at).toISOString() : undefined,
      updated_at: listing.updated_at ? new Date(listing.updated_at).toISOString() : undefined,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Error creating listing:', error);
    
    let errorMessage = 'Failed to create listing';
    let statusCode = 500;
    
    // Handle Supabase-specific errors
    if (error?.code === '23505') { // Unique violation
      errorMessage = 'A listing with this information already exists';
      statusCode = 409;
    } else if (error?.code === '23503') { // Foreign key violation
      errorMessage = 'Invalid reference in listing data';
      statusCode = 400;
    } else if (error?.code === '23502') { // Not null violation
      errorMessage = 'Required field is missing';
      statusCode = 400;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    const errorResponse: any = { 
      error: 'Failed to create listing',
      message: errorMessage,
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = {
        name: error?.name,
        code: error?.code,
        message: error?.message,
        stack: error?.stack?.substring(0,1000),
      };
    }
    
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
