import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || crypto.randomBytes(32).toString('hex');

function verifyToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const data = JSON.parse(decoded);
    
    const { signature, ...payload } = data;
    
    const expectedSignature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return false;
    }
    
    // Check token age (24 hours)
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - payload.timestamp > maxAge) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;

  if (!token) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  const isValid = verifyToken(token);

  if (!isValid) {
    const response = NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
    response.cookies.delete('admin_token');
    return response;
  }

  return NextResponse.json({ authenticated: true });
}

