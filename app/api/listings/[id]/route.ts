import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await request.json();
    const { id } = await params;

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
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.contact_name !== undefined) updateData.contact_name = data.contact_name;
    if (data.contact_phone !== undefined) updateData.contact_phone = data.contact_phone;
    if (data.facebook_contact !== undefined) updateData.facebook_contact = data.facebook_contact;
    if (data.image_url !== undefined) updateData.image_url = data.image_url;
    if (data.reference_link !== undefined) updateData.reference_link = data.reference_link;
    if (data.google_maps_link !== undefined) updateData.google_maps_link = data.google_maps_link;
    if (data.duration_days !== undefined) updateData.duration_days = data.duration_days;
    if (data.expires_at !== undefined) updateData.expires_at = data.expires_at ? new Date(data.expires_at) : null;
    if (data.verified !== undefined) updateData.verified = data.verified;
    if (data.opening_hours !== undefined) updateData.opening_hours = data.opening_hours;
    if (data.services_offered !== undefined) updateData.services_offered = data.services_offered;
    if (data.average_rating !== undefined) updateData.average_rating = data.average_rating;
    if (data.review_count !== undefined) updateData.review_count = data.review_count;
    if (data.event_date !== undefined) updateData.event_date = data.event_date ? new Date(data.event_date) : null;
    if (data.event_time !== undefined) updateData.event_time = data.event_time;
    if (data.event_end_date !== undefined) updateData.event_end_date = data.event_end_date ? new Date(data.event_end_date) : null;
    if (data.organizer_name !== undefined) updateData.organizer_name = data.organizer_name;
    if (data.organizer_contact !== undefined) updateData.organizer_contact = data.organizer_contact;

    const listing = await prisma.listing.update({
      where: { id },
      data: updateData,
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
    console.error('Error updating listing:', error);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.listing.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}

