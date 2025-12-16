import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

// Use Node.js runtime for Supabase compatibility
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ message: 'Not available during build' }, { status: 503 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { id } = await params;

    const { data: listing, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
      }
      throw error;
    }

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...listing,
      created_date: listing.created_at ? new Date(listing.created_at).toISOString() : new Date().toISOString(),
      updated_date: listing.updated_at ? new Date(listing.updated_at).toISOString() : new Date().toISOString(),
      created_at: listing.created_at ? new Date(listing.created_at).toISOString() : undefined,
      updated_at: listing.updated_at ? new Date(listing.updated_at).toISOString() : undefined,
    });
  } catch (error: any) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing', message: error?.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ message: 'Not available during build' }, { status: 503 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const data = await request.json();
    const { id } = await params;

    // Build update object (only include provided fields)
    const updateData: any = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.area !== undefined) updateData.area = data.area;
    if (data.exact_location !== undefined) updateData.exact_location = data.exact_location;
    if (data.location_consent !== undefined) updateData.location_consent = data.location_consent;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.capacity_min !== undefined) updateData.capacity_min = data.capacity_min;
    if (data.capacity_max !== undefined) updateData.capacity_max = data.capacity_max;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.family_friendly !== undefined) updateData.family_friendly = data.family_friendly;
    // Accessibility fields
    if (data.wheelchair_accessible !== undefined) updateData.wheelchair_accessible = data.wheelchair_accessible;
    if (data.accessible_parking !== undefined) updateData.accessible_parking = data.accessible_parking;
    if (data.accessible_restrooms !== undefined) updateData.accessible_restrooms = data.accessible_restrooms;
    if (data.accessible_entrance !== undefined) updateData.accessible_entrance = data.accessible_entrance;
    if (data.elevator_available !== undefined) updateData.elevator_available = data.elevator_available;
    if (data.ramp_available !== undefined) updateData.ramp_available = data.ramp_available;
    if (data.sign_language_available !== undefined) updateData.sign_language_available = data.sign_language_available;
    if (data.braille_available !== undefined) updateData.braille_available = data.braille_available;
    if (data.hearing_loop_available !== undefined) updateData.hearing_loop_available = data.hearing_loop_available;
    // Medical care fields
    if (data.medical_specialties !== undefined) updateData.medical_specialties = data.medical_specialties;
    if (data.emergency_services !== undefined) updateData.emergency_services = data.emergency_services;
    if (data.hours_24 !== undefined) updateData.hours_24 = data.hours_24;
    if (data.insurance_accepted !== undefined) updateData.insurance_accepted = data.insurance_accepted;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.contact_name !== undefined) updateData.contact_name = data.contact_name;
    if (data.contact_phone !== undefined) updateData.contact_phone = data.contact_phone;
    if (data.facebook_contact !== undefined) updateData.facebook_contact = data.facebook_contact;
    if (data.image_url !== undefined) updateData.image_url = data.image_url;
    if (data.reference_link !== undefined) updateData.reference_link = data.reference_link;
    if (data.google_maps_link !== undefined) updateData.google_maps_link = data.google_maps_link;
    if (data.duration_days !== undefined) updateData.duration_days = data.duration_days;
    if (data.expires_at !== undefined) updateData.expires_at = data.expires_at ? new Date(data.expires_at).toISOString() : null;
    if (data.verified !== undefined) updateData.verified = data.verified;
    if (data.opening_hours !== undefined) updateData.opening_hours = data.opening_hours;
    if (data.services_offered !== undefined) updateData.services_offered = data.services_offered;
    if (data.average_rating !== undefined) updateData.average_rating = data.average_rating;
    if (data.review_count !== undefined) updateData.review_count = data.review_count;
    if (data.event_date !== undefined) updateData.event_date = data.event_date ? new Date(data.event_date).toISOString() : null;
    if (data.event_time !== undefined) updateData.event_time = data.event_time;
    if (data.event_end_date !== undefined) updateData.event_end_date = data.event_end_date ? new Date(data.event_end_date).toISOString() : null;
    if (data.organizer_name !== undefined) updateData.organizer_name = data.organizer_name;
    if (data.organizer_contact !== undefined) updateData.organizer_contact = data.organizer_contact;

    const { data: listing, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
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
    console.error('Error updating listing:', error);
    return NextResponse.json(
      { error: 'Failed to update listing', message: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ message: 'Not available during build' }, { status: 503 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { id } = await params;

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting listing:', error);
    return NextResponse.json(
      { error: 'Failed to delete listing', message: error?.message },
      { status: 500 }
    );
  }
}
