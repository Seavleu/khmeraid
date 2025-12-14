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

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.help_type !== undefined) updateData.help_type = data.help_type;
    if (data.urgency !== undefined) updateData.urgency = data.urgency;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.last_updated !== undefined) updateData.last_updated = new Date(data.last_updated);
    if (data.shared_with_contacts !== undefined) updateData.shared_with_contacts = data.shared_with_contacts;
    if (data.share_token !== undefined) updateData.share_token = data.share_token;

    const helpSeeker = await prisma.helpSeeker.update({
      where: { id },
      data: updateData,
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
    console.error('Error updating help seeker:', error);
    return NextResponse.json({ error: 'Failed to update help seeker' }, { status: 500 });
  }
}

