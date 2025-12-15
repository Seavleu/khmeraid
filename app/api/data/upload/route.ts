import { NextRequest, NextResponse } from 'next/server';
import { verifyApiToken } from '@/lib/api-crypto';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://app.base44.com/api/apps/693e2182609fd8b658845d5b';
const BACKEND_API_KEY = process.env.BACKEND_API_KEY || '992ddf25dee2456e916794cbd4399325';

export async function POST(request: NextRequest) {
  try {
    // Verify token
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
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload to backend (Base44)
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const response = await fetch(`${BACKEND_API_URL}/integrations/Core/UploadFile`, {
      method: 'POST',
      headers: {
        'api_key': BACKEND_API_KEY,
      },
      body: uploadFormData,
      signal: AbortSignal.timeout(30000), // 30 second timeout for file uploads
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const result = await response.json();
    return NextResponse.json({ 
      file_url: result.file_url || result.url || '' 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

