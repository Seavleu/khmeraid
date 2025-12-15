import { NextRequest, NextResponse } from 'next/server';
import { generateApiToken } from '@/lib/api-crypto';

// Public token endpoint - generates a token for client use
export async function GET(request: NextRequest) {
  try {
    // Generate a public token (no sensitive data)
    const token = generateApiToken({
      type: 'public',
      scope: 'read',
    });
    
    return NextResponse.json({ token }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}

