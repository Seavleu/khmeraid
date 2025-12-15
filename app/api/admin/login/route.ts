import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { appendFile } from 'fs/promises';
import { join } from 'path';

// Secure admin credentials (should be in environment variables)
// In production, use a proper database with hashed passwords
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'admin',
  // Password hash should be generated using: crypto.createHash('sha256').update('your_password').digest('hex')
  // Default password is '092862336' (hash: 671ed2d75e8ddc913561013e68a0a78a80603c29f30374573dcf47c28536f996)
  passwordHash: process.env.ADMIN_PASSWORD_HASH || crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD || '092862336').digest('hex'),
};

// Log expected credentials at startup (for debugging)
async function logToFile(data: any) {
  try {
    const logPath = join(process.cwd(), '.cursor', 'debug.log');
    const logEntry = JSON.stringify({...data, timestamp: Date.now()}) + '\n';
    await appendFile(logPath, logEntry, 'utf8').catch(() => {});
  } catch (e) {
    // Ignore file write errors
  }
}

if (process.env.NODE_ENV === 'development') {
  const expectedHash = crypto.createHash('sha256').update('092862336').digest('hex');
  console.log('[ADMIN LOGIN] Expected credentials:', {
    username: ADMIN_CREDENTIALS.username,
    passwordHashPrefix: ADMIN_CREDENTIALS.passwordHash.substring(0, 20) + '...',
    fullPasswordHash: ADMIN_CREDENTIALS.passwordHash,
    expectedHashFor092862336: expectedHash,
    hashMatches: ADMIN_CREDENTIALS.passwordHash === expectedHash,
    usingEnvPassword: !!process.env.ADMIN_PASSWORD,
    envPasswordValue: process.env.ADMIN_PASSWORD || 'not set',
    usingEnvPasswordHash: !!process.env.ADMIN_PASSWORD_HASH
  });
  logToFile({
    location: 'app/api/admin/login/route.ts:startup',
    message: 'Module loaded - ADMIN_CREDENTIALS initialized',
    data: {
      username: ADMIN_CREDENTIALS.username,
      passwordHash: ADMIN_CREDENTIALS.passwordHash,
      expectedHashFor092862336: expectedHash,
      hashMatches: ADMIN_CREDENTIALS.passwordHash === expectedHash,
      usingEnvPassword: !!process.env.ADMIN_PASSWORD,
      envPasswordValue: process.env.ADMIN_PASSWORD || 'not set'
    },
    sessionId: 'debug-session',
    runId: 'startup',
    hypothesisId: 'A'
  });
}

// Secret key for token signing (should be a strong random string in production)
const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || crypto.randomBytes(32).toString('hex');

// Generate secure token
function generateToken(username: string): string {
  const payload = {
    username,
    timestamp: Date.now(),
    random: crypto.randomBytes(16).toString('hex'),
  };
  
  // Create HMAC signature
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  // Combine payload and signature
  const token = Buffer.from(JSON.stringify({ ...payload, signature })).toString('base64');
  
  return token;
}

// Verify token
function verifyToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const data = JSON.parse(decoded);
    
    // Extract signature
    const { signature, ...payload } = data;
    
    // Recreate signature
    const expectedSignature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    // Verify signature matches
    if (signature !== expectedSignature) {
      return false;
    }
    
    // Check token age (24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (Date.now() - payload.timestamp > maxAge) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

// Hash password
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  // #region agent log
  const loginDebugData = {
    hasAdminUsername: !!process.env.ADMIN_USERNAME,
    hasAdminPassword: !!process.env.ADMIN_PASSWORD,
    hasAdminPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,
    expectedUsername: ADMIN_CREDENTIALS.username,
    expectedPasswordHashPrefix: ADMIN_CREDENTIALS.passwordHash.substring(0, 20),
    fullExpectedPasswordHash: ADMIN_CREDENTIALS.passwordHash
  };
  console.log('[LOGIN DEBUG] Login POST called', loginDebugData);
  await logToFile({
    location: 'app/api/admin/login/route.ts:116',
    message: 'Login POST called',
    data: loginDebugData,
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId: 'A'
  });
  fetch('http://127.0.0.1:7242/ingest/4f6cab59-3095-4364-9c6b-f783773990a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/login/route.ts:73',message:'Login POST called',data:loginDebugData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    const body = await request.json();
    const { username, password } = body;

    // #region agent log
    const requestDebugData = {
      username,
      passwordLength: password?.length,
      expectedUsername: ADMIN_CREDENTIALS.username
    };
    console.log('[LOGIN DEBUG] Request body parsed', requestDebugData);
    await logToFile({
      location: 'app/api/admin/login/route.ts:128',
      message: 'Request body parsed',
      data: requestDebugData,
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'B'
    });
    fetch('http://127.0.0.1:7242/ingest/4f6cab59-3095-4364-9c6b-f783773990a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/login/route.ts:76',message:'Request body parsed',data:requestDebugData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Check credentials
    const passwordHash = hashPassword(password);
    
    // #region agent log
    const hashMatch = passwordHash === ADMIN_CREDENTIALS.passwordHash;
    const usernameMatch = username === ADMIN_CREDENTIALS.username;
    console.log('[LOGIN DEBUG] Password hash comparison', {
      usernameMatch,
      passwordHashMatch: hashMatch,
      expectedPasswordHashPrefix: ADMIN_CREDENTIALS.passwordHash.substring(0, 20),
      receivedPasswordHashPrefix: passwordHash.substring(0, 20),
      fullExpectedHash: ADMIN_CREDENTIALS.passwordHash,
      fullReceivedHash: passwordHash,
      passwordProvided: password,
      passwordLength: password?.length
    });
    await logToFile({
      location: 'app/api/admin/login/route.ts:94',
      message: 'Password hash comparison',
      data: {
        usernameMatch,
        passwordHashMatch: hashMatch,
        expectedPasswordHash: ADMIN_CREDENTIALS.passwordHash,
        receivedPasswordHash: passwordHash,
        passwordProvided: password,
        passwordLength: password?.length,
        usernameProvided: username,
        expectedUsername: ADMIN_CREDENTIALS.username
      },
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'C'
    });
    fetch('http://127.0.0.1:7242/ingest/4f6cab59-3095-4364-9c6b-f783773990a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/login/route.ts:87',message:'Password hash comparison',data:{usernameMatch:username===ADMIN_CREDENTIALS.username,passwordHashMatch:passwordHash===ADMIN_CREDENTIALS.passwordHash,expectedPasswordHashPrefix:ADMIN_CREDENTIALS.passwordHash.substring(0,20),receivedPasswordHashPrefix:passwordHash.substring(0,20),fullExpectedHash:ADMIN_CREDENTIALS.passwordHash,fullReceivedHash:passwordHash},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    if (username !== ADMIN_CREDENTIALS.username || 
        passwordHash !== ADMIN_CREDENTIALS.passwordHash) {
      // #region agent log
      const failureDebugData = {
        usernameMatch: username === ADMIN_CREDENTIALS.username,
        passwordHashMatch: passwordHash === ADMIN_CREDENTIALS.passwordHash,
        usernameProvided: username,
        expectedUsername: ADMIN_CREDENTIALS.username,
        passwordProvided: password,
        expectedPasswordHash: ADMIN_CREDENTIALS.passwordHash,
        receivedPasswordHash: passwordHash
      };
      console.log('[LOGIN DEBUG] Login failed - invalid credentials', failureDebugData);
      await logToFile({
        location: 'app/api/admin/login/route.ts:203',
        message: 'Login failed - invalid credentials',
        data: failureDebugData,
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'D'
      });
      fetch('http://127.0.0.1:7242/ingest/4f6cab59-3095-4364-9c6b-f783773990a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/login/route.ts:90',message:'Login failed - invalid credentials',data:failureDebugData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      // Add delay to prevent brute force attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4f6cab59-3095-4364-9c6b-f783773990a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/login/route.ts:100',message:'Login successful',data:{username},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    // Generate secure token
    const token = generateToken(username);

    // Set secure HTTP-only cookie
    const response = NextResponse.json({ success: true });
    
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

