import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

// Simple test endpoint at /api/listings/test
export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ 
      error: 'Supabase configuration not set',
      count: 0,
      listings: []
    }, { status: 500 });
  }

  try {
    const supabase = getSupabaseServerClient();
    
    // Get all listings
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (listingsError) {
      throw listingsError;
    }

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    // Return test data
    return NextResponse.json({
      success: true,
      count: listings?.length || 0,
      total_in_db: totalCount || 0,
      timestamp: new Date().toISOString(),
      listings: (listings || []).map((listing: any) => ({
        id: listing.id,
        title: listing.title,
        type: listing.type,
        area: listing.area,
        status: listing.status,
        verified: listing.verified,
        created_at: listing.created_at ? new Date(listing.created_at).toISOString() : undefined,
        latitude: listing.latitude,
        longitude: listing.longitude,
        contact_name: listing.contact_name,
        contact_phone: listing.contact_phone,
        wheelchair_accessible: listing.wheelchair_accessible,
        medical_specialties: listing.medical_specialties,
        emergency_services: listing.emergency_services,
      }))
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? {
        name: error?.name,
        code: error?.code,
        message: error?.message,
        stack: error?.stack?.substring(0, 500)
      } : undefined,
      count: 0,
      listings: []
    }, { status: 500 });
  }
}
