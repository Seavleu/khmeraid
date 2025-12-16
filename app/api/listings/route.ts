import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

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
    const listingData = {
      title: data.title.trim(),
      type: data.type.trim(),
      area: data.area.trim(),
      exact_location: data.exact_location || null,
      location_consent: Boolean(data.location_consent),
      latitude: toFloatOrNull(data.latitude),
      longitude: toFloatOrNull(data.longitude),
      capacity_min: toIntOrNull(data.capacity_min),
      capacity_max: toIntOrNull(data.capacity_max),
      status: data.status || 'open',
      family_friendly: Boolean(data.family_friendly),
      // Accessibility fields
      wheelchair_accessible: Boolean(data.wheelchair_accessible),
      accessible_parking: Boolean(data.accessible_parking),
      accessible_restrooms: Boolean(data.accessible_restrooms),
      accessible_entrance: Boolean(data.accessible_entrance),
      elevator_available: Boolean(data.elevator_available),
      ramp_available: Boolean(data.ramp_available),
      sign_language_available: Boolean(data.sign_language_available),
      braille_available: Boolean(data.braille_available),
      hearing_loop_available: Boolean(data.hearing_loop_available),
      // Medical care fields
      medical_specialties: Array.isArray(data.medical_specialties) ? data.medical_specialties : [],
      emergency_services: Boolean(data.emergency_services),
      hours_24: Boolean(data.hours_24),
      insurance_accepted: Boolean(data.insurance_accepted),
      notes: data.notes || null,
      contact_name: data.contact_name || null,
      contact_phone: data.contact_phone || null,
      facebook_contact: data.facebook_contact || null,
      image_url: data.image_url || null,
      reference_link: data.reference_link || null,
      google_maps_link: data.google_maps_link || null,
      duration_days: toIntOrNull(data.duration_days),
      expires_at: toDateOrNull(data.expires_at),
      verified: Boolean(data.verified),
      opening_hours: data.opening_hours || null,
      services_offered: Array.isArray(data.services_offered) ? data.services_offered : [],
      average_rating: toFloatOrNull(data.average_rating),
      review_count: toIntOrNull(data.review_count) ?? 0,
      event_date: toDateOrNull(data.event_date),
      event_time: data.event_time || null,
      event_end_date: toDateOrNull(data.event_end_date),
      organizer_name: data.organizer_name || null,
      organizer_contact: data.organizer_contact || null,
    };

    // Log the data being inserted (without sensitive info)
    console.log('Creating listing with data:', {
      title: listingData.title,
      type: listingData.type,
      area: listingData.area,
      hasLocation: !!(listingData.latitude && listingData.longitude),
      hasExactLocation: !!listingData.exact_location,
      locationConsent: listingData.location_consent
    });

    const { data: listing, error } = await supabase
      .from('listings')
      .insert(listingData)
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
