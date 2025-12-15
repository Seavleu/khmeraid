import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Use Web Crypto API for Edge Runtime compatibility
const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'default-secret-change-in-production';

// Convert string to ArrayBuffer
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

// Convert ArrayBuffer to hex string
async function arrayBufferToHex(buffer: ArrayBuffer): Promise<string> {
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify token inline using Web Crypto API (Edge Runtime compatible)
async function verifyTokenInline(token: string): Promise<boolean> {
  try {
    // Decode base64 token
    const decoded = atob(token);
    const data = JSON.parse(decoded);
    
    const { signature, ...payload } = data;
    
    // Create HMAC signature using Web Crypto API
    const keyData = stringToArrayBuffer(TOKEN_SECRET);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const payloadString = JSON.stringify(payload);
    const payloadBuffer = stringToArrayBuffer(payloadString);
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, payloadBuffer);
    const expectedSignature = await arrayBufferToHex(signatureBuffer);
    
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

// Thailand IP ranges (CIDR notation) - Common ranges
const THAILAND_IP_RANGES = [
  // Major ISPs and data centers
  '1.0.0.0/8',
  '14.0.0.0/8',
  '27.0.0.0/8',
  '49.0.0.0/8',
  '58.0.0.0/8',
  '61.0.0.0/8',
  '110.0.0.0/8',
  '111.0.0.0/8',
  '113.0.0.0/8',
  '114.0.0.0/8',
  '115.0.0.0/8',
  '116.0.0.0/8',
  '117.0.0.0/8',
  '118.0.0.0/8',
  '119.0.0.0/8',
  '122.0.0.0/8',
  '171.0.0.0/8',
  '180.0.0.0/8',
  '182.0.0.0/8',
  '183.0.0.0/8',
  '202.0.0.0/8',
  '203.0.0.0/8',
  '223.0.0.0/8',
];

// Helper function to check if IP is in CIDR range
function ipToNumber(ip: string): number {
  const parts = ip.split('.');
  return (parseInt(parts[0]) << 24) + 
         (parseInt(parts[1]) << 16) + 
         (parseInt(parts[2]) << 8) + 
         parseInt(parts[3]);
}

function cidrToRange(cidr: string): { start: number; end: number } {
  const [ip, prefix] = cidr.split('/');
  const prefixLength = parseInt(prefix);
  const ipNum = ipToNumber(ip);
  const mask = (0xFFFFFFFF << (32 - prefixLength)) >>> 0;
  const start = ipNum & mask;
  const end = start | (~mask >>> 0);
  return { start, end };
}

function isIPInRange(ip: string, ranges: string[]): boolean {
  const ipNum = ipToNumber(ip);
  return ranges.some(range => {
    const { start, end } = cidrToRange(range);
    return ipNum >= start && ipNum <= end;
  });
}

// Get real IP address from request
function getClientIP(request: NextRequest): string {
  // Check various headers for real IP (in order of preference)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to connection remote address
  return request.ip || '0.0.0.0';
}

// Check if IP is from Thailand using geolocation API
async function checkThailandIP(ip: string): Promise<boolean> {
  // First check against known IP ranges
  if (isIPInRange(ip, THAILAND_IP_RANGES)) {
    return true;
  }

  // Additional check using IP geolocation API (optional, more accurate)
  try {
    // Using ip-api.com (free, no API key required)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.countryCode === 'TH') {
        return true;
      }
    }
  } catch (error) {
    // If geolocation check fails, fall back to IP range check
    console.error('IP geolocation check failed:', error);
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    // Skip login page
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Get client IP
    const clientIP = getClientIP(request);

    // Check if IP is from Thailand
    const isThailand = await checkThailandIP(clientIP);
    
    if (isThailand) {
      // Block Thailand IPs
      return NextResponse.json(
        { 
          error: 'Access denied',
          message: 'Access from this location is not permitted'
        },
        { status: 403 }
      );
    }

    // Check authentication token
    const token = request.cookies.get('admin_token')?.value;
    
    if (!token) {
      // Redirect to login if no token
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token using inline verification (to avoid circular fetch)
    let isValid = false;
    try {
      isValid = await verifyTokenInline(token);
    } catch (error) {
      isValid = false;
    }
    
    if (!isValid) {
      // Invalid token, redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('admin_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/login',
    '/api/admin/logout',
  ],
};

