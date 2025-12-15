import { NextRequest, NextResponse } from 'next/server';
import { verifyApiToken } from '@/lib/api-crypto';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://app.base44.com/api/apps/693e2182609fd8b658845d5b';
const BACKEND_API_KEY = process.env.BACKEND_API_KEY || '992ddf25dee2456e916794cbd4399325';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const { valid } = verifyApiToken(token);
    
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_API_URL}/entities/Listing/${params.id}`, {
      method: 'PUT',
      headers: {
        'api_key': BACKEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update listing');
    }
    
    const data = await response.json();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const { valid } = verifyApiToken(token);
    
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    const response = await fetch(`${BACKEND_API_URL}/entities/Listing/${params.id}`, {
      method: 'DELETE',
      headers: {
        'api_key': BACKEND_API_KEY,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete listing');
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

