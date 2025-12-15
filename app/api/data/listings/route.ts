import { NextRequest, NextResponse } from 'next/server';
import { verifyApiToken } from '@/lib/api-crypto';

// Cache configuration
const CACHE_DURATION = 10 * 1000; // 10 seconds
const cache = new Map<string, { data: any; timestamp: number }>();

// Backend API configuration (hidden from client)
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://app.base44.com/api/apps/693e2182609fd8b658845d5b';
const BACKEND_API_KEY = process.env.BACKEND_API_KEY || '992ddf25dee2456e916794cbd4399325';

// Clean old cache entries
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
}

// Get from cache or fetch
async function getCachedData(key: string, fetcher: () => Promise<any>): Promise<any> {
  cleanCache();
  
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

export async function GET(request: NextRequest) {
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
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || '-created_at';
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // Generate cache key
    const cacheKey = `listings:${sort}:${limit}`;
    
    // Fetch data with caching
    const data = await getCachedData(cacheKey, async () => {
      const params = new URLSearchParams();
      if (sort) params.append('sort', sort);
      if (limit) params.append('limit', limit.toString());
      
      const response = await fetch(`${BACKEND_API_URL}/entities/Listing?${params.toString()}`, {
        headers: {
          'api_key': BACKEND_API_KEY,
          'Content-Type': 'application/json',
        },
        // Add timeout for low bandwidth scenarios
        signal: AbortSignal.timeout(5000),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const result = await response.json();
      return Array.isArray(result) ? result : result.items || result.results || [];
    });
    
    return NextResponse.json({ data }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    
    const body = await request.json();
    
    // Invalidate cache
    cache.clear();
    
    const response = await fetch(`${BACKEND_API_URL}/entities/Listing`, {
      method: 'POST',
      headers: {
        'api_key': BACKEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create listing');
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

