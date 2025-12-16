import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  // During build time, return early
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ helpSeekers: [], message: 'Not available during build' });
  }

  try {
    const supabase = getSupabaseServerClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const help_type = searchParams.get('help_type');
    const urgency = searchParams.get('urgency');
    const share_token = searchParams.get('share_token');

    // Build Supabase query
    let query = supabase
      .from('help_seekers')
      .select('*');

    // Apply filters
    if (status) query = query.eq('status', status);
    if (help_type) query = query.eq('help_type', help_type);
    if (urgency) query = query.eq('urgency', urgency);
    if (share_token) query = query.eq('share_token', share_token);

    // Apply sorting
    query = query.order('created_at', { ascending: false });

    const { data: helpSeekers, error } = await query;

    if (error) {
      throw error;
    }

    // Format help seekers to match expected format (JSON schema)
    const formatted = (helpSeekers || []).map((helpSeeker: any) => ({
      ...helpSeeker,
      created_date: helpSeeker.created_at ? new Date(helpSeeker.created_at).toISOString() : new Date().toISOString(),
      updated_date: helpSeeker.updated_at ? new Date(helpSeeker.updated_at).toISOString() : new Date().toISOString(),
      created_at: helpSeeker.created_at ? new Date(helpSeeker.created_at).toISOString() : undefined,
      updated_at: helpSeeker.updated_at ? new Date(helpSeeker.updated_at).toISOString() : undefined,
      last_updated: helpSeeker.last_updated 
        ? new Date(helpSeeker.last_updated).toISOString() 
        : helpSeeker.created_at 
        ? new Date(helpSeeker.created_at).toISOString() 
        : new Date().toISOString(),
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
        message: error?.message,
        stack: error?.stack?.substring(0,1000),
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
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      return NextResponse.json(
        { error: 'Validation error', message: 'Name is required' },
        { status: 400 }
      );
    }

    if (!data.phone || typeof data.phone !== 'string' || data.phone.trim() === '') {
      return NextResponse.json(
        { error: 'Validation error', message: 'Phone is required' },
        { status: 400 }
      );
    }

    if (data.latitude === null || data.latitude === undefined || typeof data.latitude !== 'number') {
      return NextResponse.json(
        { error: 'Validation error', message: 'Latitude is required and must be a number' },
        { status: 400 }
      );
    }

    if (data.longitude === null || data.longitude === undefined || typeof data.longitude !== 'number') {
      return NextResponse.json(
        { error: 'Validation error', message: 'Longitude is required and must be a number' },
        { status: 400 }
      );
    }

    if (!data.help_type || typeof data.help_type !== 'string' || data.help_type.trim() === '') {
      return NextResponse.json(
        { error: 'Validation error', message: 'Help type is required' },
        { status: 400 }
      );
    }

    // Validate enum values
    const validHelpTypes = ['medical', 'shelter', 'food', 'transportation', 'other'];
    if (!validHelpTypes.includes(data.help_type)) {
      return NextResponse.json(
        { error: 'Validation error', message: `Help type must be one of: ${validHelpTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (data.urgency && !['low', 'medium', 'high', 'critical'].includes(data.urgency)) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Urgency must be one of: low, medium, high, critical' },
        { status: 400 }
      );
    }

    if (data.status && !['active', 'helped', 'cancelled'].includes(data.status)) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Status must be one of: active, helped, cancelled' },
        { status: 400 }
      );
    }

    // Helper function to safely convert date
    const toDateOrNow = (value: any): string => {
      if (!value) return new Date().toISOString();
      try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
      } catch {
        return new Date().toISOString();
      }
    };

    const helpSeekerData = {
      name: data.name.trim(),
      phone: data.phone.trim(),
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      help_type: data.help_type.trim(),
      urgency: data.urgency || 'medium',
      status: data.status || 'active',
      notes: data.notes || null,
      last_updated: toDateOrNow(data.last_updated),
      shared_with_contacts: Array.isArray(data.shared_with_contacts) ? data.shared_with_contacts : [],
      share_token: data.share_token || null,
    };

    const { data: helpSeeker, error } = await supabase
      .from('help_seekers')
      .insert(helpSeekerData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ...helpSeeker,
      created_date: helpSeeker.created_at ? new Date(helpSeeker.created_at).toISOString() : new Date().toISOString(),
      updated_date: helpSeeker.updated_at ? new Date(helpSeeker.updated_at).toISOString() : new Date().toISOString(),
      created_at: helpSeeker.created_at ? new Date(helpSeeker.created_at).toISOString() : undefined,
      updated_at: helpSeeker.updated_at ? new Date(helpSeeker.updated_at).toISOString() : undefined,
      last_updated: helpSeeker.last_updated ? new Date(helpSeeker.last_updated).toISOString() : new Date().toISOString(),
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Error creating help seeker:', error);
    
    let errorMessage = 'Failed to create help seeker';
    let statusCode = 500;
    
    // Handle Supabase-specific errors
    if (error?.code === '23505') { // Unique violation
      errorMessage = 'A help seeker with this information already exists';
      statusCode = 409;
    } else if (error?.code === '23502') { // Not null violation
      errorMessage = 'Missing required field';
      statusCode = 400;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    const errorResponse: any = { 
      error: 'Failed to create help seeker',
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
