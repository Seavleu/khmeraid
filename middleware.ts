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

// Cambodia IP ranges (CIDR notation) - Known Cambodia IP ranges
// This is a fallback allowlist in case geolocation API fails or returns incorrect data
const CAMBODIA_IP_RANGES: string[] = [
  // Add known Cambodia IP ranges here if needed
  // Example: '103.xxx.xxx.xxx/24'
  // For now, we rely on geolocation API, but this can be expanded
];

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
  const netlifyIP = request.headers.get('x-nf-client-connection-ip'); // Netlify
  
  // #region agent log
  console.log('[DEBUG] getClientIP: Headers - x-forwarded-for:', forwarded, 'x-real-ip:', realIP, 'cf-connecting-ip:', cfConnectingIP, 'x-nf-client-connection-ip:', netlifyIP);
  // #endregion
  
  if (netlifyIP) {
    // #region agent log
    console.log('[DEBUG] getClientIP: Using Netlify IP', netlifyIP);
    // #endregion
    return netlifyIP;
  }
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ip = forwarded.split(',')[0].trim();
    // #region agent log
    console.log('[DEBUG] getClientIP: Using x-forwarded-for IP', ip);
    // #endregion
    return ip;
  }
  if (realIP) {
    // #region agent log
    console.log('[DEBUG] getClientIP: Using x-real-ip', realIP);
    // #endregion
    return realIP;
  }
  if (cfConnectingIP) {
    // #region agent log
    console.log('[DEBUG] getClientIP: Using cf-connecting-ip', cfConnectingIP);
    // #endregion
    return cfConnectingIP;
  }
  
  // Fallback to connection remote address
  const fallbackIP = request.ip || '0.0.0.0';
  // #region agent log
  console.log('[DEBUG] getClientIP: Using fallback IP', fallbackIP);
  // #endregion
  return fallbackIP;
}

// Check IP country code using geolocation API
async function getIPCountryCode(ip: string): Promise<string | null> {
  // #region agent log
  console.log('[DEBUG] getIPCountryCode: Checking IP', ip);
  // #endregion
  
  // Additional check using IP geolocation API (optional, more accurate)
  try {
    // Using ip-api.com (free, no API key required)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });
    
    // #region agent log
    console.log('[DEBUG] getIPCountryCode: API response status', response.status);
    // #endregion
    
    if (response.ok) {
      const data = await response.json();
      // #region agent log
      console.log('[DEBUG] getIPCountryCode: API response data', JSON.stringify(data));
      // #endregion
      // Handle both success and error responses from ip-api.com
      if (data.status === 'success' && data.countryCode) {
        // #region agent log
        console.log('[DEBUG] getIPCountryCode: Detected country code', data.countryCode);
        // #endregion
        return data.countryCode;
      } else if (data.status === 'fail') {
        // #region agent log
        console.log('[DEBUG] getIPCountryCode: API returned fail status:', data.message);
        // #endregion
        return null;
      } else if (data.countryCode) {
        // Fallback: if countryCode exists even without status field
        // #region agent log
        console.log('[DEBUG] getIPCountryCode: Detected country code (no status field)', data.countryCode);
        // #endregion
        return data.countryCode;
      }
    } else {
      // #region agent log
      console.log('[DEBUG] getIPCountryCode: API returned non-OK status:', response.status, response.statusText);
      // #endregion
    }
  } catch (error) {
    // If geolocation check fails, return null
    // #region agent log
    console.error('[DEBUG] getIPCountryCode: IP geolocation check failed:', error);
    // #endregion
  }

  // #region agent log
  console.log('[DEBUG] getIPCountryCode: Returning null (geolocation failed or no country code)');
  // #endregion
  return null;
}

// Check if IP is from Thailand using geolocation API
async function checkThailandIP(ip: string): Promise<boolean> {
  // #region agent log
  console.log('[DEBUG] checkThailandIP: Checking IP', ip);
  // #endregion
  
  // Prioritize geolocation API check (more accurate)
  const countryCode = await getIPCountryCode(ip);
  
  // #region agent log
  console.log('[DEBUG] checkThailandIP: Country code result', countryCode);
  // #endregion
  
  if (countryCode === 'TH') {
    // #region agent log
    console.log('[DEBUG] checkThailandIP: IP is from Thailand, blocking');
    // #endregion
    return true;
  }
  
  // If geolocation check succeeded and returned a country code, trust it
  if (countryCode !== null) {
    // #region agent log
    console.log('[DEBUG] checkThailandIP: IP is NOT from Thailand (country:', countryCode, '), allowing');
    // #endregion
    return false;
  }

  // If geolocation API fails, default to ALLOWING access
  // This prevents false positives from overly broad IP ranges
  // Only block if we have high confidence (geolocation API success)
  // #region agent log
  console.log('[DEBUG] checkThailandIP: Geolocation API failed - defaulting to ALLOW (fail-open policy to prevent false positives)');
  // #endregion
  
  return false;
}

// Check if IP is from Cambodia using geolocation API
async function checkCambodiaIP(ip: string): Promise<boolean> {
  const countryCode = await getIPCountryCode(ip);
  if (countryCode === 'KH') {
    return true;
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

    // IP BLOCKING IS NOW DISABLED BY DEFAULT
    // To enable IP blocking, set ENABLE_IP_BLOCKING=true in Netlify environment variables
    // This prevents false positives from blocking legitimate users
    const enableIPBlocking = process.env.ENABLE_IP_BLOCKING === 'true';
    
    // OPTION: Bypass via query parameter (for testing/debugging)
    // Add ?bypass_ip_check=true to the URL to bypass IP blocking for that request
    const bypassViaQuery = request.nextUrl.searchParams.get('bypass_ip_check') === 'true';
    
    // #region agent log
    console.log('[DEBUG] middleware: IP blocking enabled?', enableIPBlocking);
    console.log('[DEBUG] middleware: IP blocking bypassed via query?', bypassViaQuery);
    console.log('[DEBUG] middleware: Will check IP?', enableIPBlocking && !bypassViaQuery);
    // #endregion

    // Only run IP blocking if explicitly enabled
    if (enableIPBlocking && !bypassViaQuery) {
      // Get client IP
      const clientIP = getClientIP(request);
      
      // #region agent log
      console.log('[DEBUG] middleware: Admin route access attempt, client IP:', clientIP);
      console.log('[DEBUG] middleware: Request pathname:', pathname);
      console.log('[DEBUG] middleware: All request headers:', JSON.stringify(Object.fromEntries(request.headers.entries())));
      // #endregion

      // Check IP country code first
      let countryCode: string | null = null;
      let apiError: any = null;
      try {
        countryCode = await getIPCountryCode(clientIP);
      } catch (error) {
        // #region agent log
        console.error('[DEBUG] middleware: Error getting country code:', error);
        // #endregion
        apiError = error;
        countryCode = null; // Fail open
      }
      
      // #region agent log
      console.log('[DEBUG] middleware: Detected country code:', countryCode);
      console.log('[DEBUG] middleware: Country code type:', typeof countryCode);
      console.log('[DEBUG] middleware: Country code === "TH"?', countryCode === 'TH');
      console.log('[DEBUG] middleware: Country code === "KH"?', countryCode === 'KH');
      console.log('[DEBUG] middleware: Country code value (JSON):', JSON.stringify(countryCode));
      if (apiError) {
        console.log('[DEBUG] middleware: API error occurred:', apiError);
      }
      // #endregion

      // CRITICAL DECISION LOGIC:
      // We ONLY block if countryCode is EXACTLY 'TH' (Thailand)
      // Everything else is allowed, including:
      // - null (API failed) - fail-open policy
      // - 'KH' (Cambodia) - explicitly allowed
      // - Any other country - allowed
      // - API errors - fail-open policy
      
      // Step 1: If API failed or returned null, ALWAYS ALLOW (fail-open)
      if (countryCode === null || apiError) {
        // #region agent log
        console.log('[DEBUG] middleware: ALLOWING - Geolocation API failed or returned null. Using fail-open policy.');
        console.log('[DEBUG] middleware: API error:', apiError ? String(apiError) : 'none');
        console.log('[DEBUG] middleware: This means we cannot determine the country, so we allow access to prevent false blocks.');
        // #endregion
        // Continue to authentication - DO NOT BLOCK
      } 
      // Step 2: Check if IP is in Cambodia IP ranges (fallback allowlist)
      // This helps if geolocation API is incorrect
      const isInCambodiaRange = CAMBODIA_IP_RANGES.length > 0 && isIPInRange(clientIP, CAMBODIA_IP_RANGES);
      if (isInCambodiaRange) {
        // #region agent log
        console.log('[DEBUG] middleware: ALLOWING - IP is in Cambodia IP range allowlist. IP:', clientIP);
        // #endregion
        // Continue to authentication - DO NOT BLOCK
      }
      // Step 3: EXPLICITLY ALLOW Cambodia (even if API somehow says otherwise, trust Cambodia)
      else if (countryCode === 'KH' || countryCode?.toUpperCase() === 'KH') {
        // #region agent log
        console.log('[DEBUG] middleware: ALLOWING - IP is from Cambodia (KH). Country code:', countryCode);
        // #endregion
        // Continue to authentication
      } 
      // Step 4: ONLY BLOCK if we're 100% certain it's Thailand (case-sensitive check)
      else if (countryCode === 'TH' || countryCode?.toUpperCase() === 'TH') {
        // Double-check: Make absolutely sure it's Thailand and NOT Cambodia
        // This should never happen (TH !== KH), but be extra defensive
        if (countryCode !== 'KH' && countryCode?.toUpperCase() !== 'KH') {
          // EXPLICITLY BLOCK Thailand
          // #region agent log
          console.log('[DEBUG] middleware: BLOCKING - IP is from Thailand (TH). Country code:', countryCode);
          // #endregion
          return NextResponse.json(
            { 
              error: 'Access denied',
              message: 'Access from this location is not permitted'
            },
            { status: 403 }
          );
        } else {
          // Edge case: somehow both TH and KH (shouldn't happen, but allow to be safe)
          // #region agent log
          console.log('[DEBUG] middleware: ALLOWING - Edge case detected (TH and KH both true, allowing to be safe)');
          // #endregion
        }
      } 
      // Step 5: Any other country code - allow
      else {
        // #region agent log
        console.log('[DEBUG] middleware: ALLOWING - IP is from other country:', countryCode);
        // #endregion
      }

    } else {
      // #region agent log
      if (bypassViaQuery) {
        console.log('[DEBUG] middleware: IP blocking bypassed via query parameter - allowing all IPs');
      } else {
        console.log('[DEBUG] middleware: IP blocking is DISABLED by default - allowing all IPs');
        console.log('[DEBUG] middleware: To enable IP blocking, set ENABLE_IP_BLOCKING=true in Netlify environment variables');
      }
      // #endregion
    }

    // #region agent log
    console.log('[DEBUG] middleware: IP check completed, proceeding to authentication check');
    // #endregion

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

