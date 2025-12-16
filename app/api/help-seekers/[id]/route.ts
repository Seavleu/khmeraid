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

    const { data: helpSeeker, error } = await supabase
      .from('help_seekers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Help seeker not found' }, { status: 404 });
      }
      throw error;
    }

    if (!helpSeeker) {
      return NextResponse.json({ error: 'Help seeker not found' }, { status: 404 });
    }

    return NextResponse.json({
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
    });
  } catch (error: any) {
    console.error('Error fetching help seeker:', error);
    return NextResponse.json(
      { error: 'Failed to fetch help seeker', message: error?.message },
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

    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.help_type !== undefined) updateData.help_type = data.help_type;
    if (data.urgency !== undefined) updateData.urgency = data.urgency;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.last_updated !== undefined) updateData.last_updated = new Date(data.last_updated).toISOString();
    if (data.shared_with_contacts !== undefined) updateData.shared_with_contacts = data.shared_with_contacts;
    if (data.share_token !== undefined) updateData.share_token = data.share_token;

    const { data: helpSeeker, error } = await supabase
      .from('help_seekers')
      .update(updateData)
      .eq('id', id)
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
      last_updated: helpSeeker.last_updated 
        ? new Date(helpSeeker.last_updated).toISOString() 
        : helpSeeker.created_at 
        ? new Date(helpSeeker.created_at).toISOString() 
        : new Date().toISOString(),
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Error updating help seeker:', error);
    return NextResponse.json(
      { error: 'Failed to update help seeker', message: error?.message },
      { status: 500 }
    );
  }
}
