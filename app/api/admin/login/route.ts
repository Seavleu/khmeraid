import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Secure admin credentials (should be in environment variables)
// In production, use a proper database with hashed passwords
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'admin',
  // Password hash should be generated using: crypto.createHash('sha256').update('your_password').digest('hex')
  // Default password is '0123456789' (hash: 671ed2d75e8ddc913561013e68a0a78a80603c29f30374573dcf47c28536f996)
  passwordHash: process.env.ADMIN_PASSWORD_HASH || crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD || '0123456789').digest('hex'),
};

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
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Check credentials
    const passwordHash = hashPassword(password);
    
    if (username !== ADMIN_CREDENTIALS.username || 
        passwordHash !== ADMIN_CREDENTIALS.passwordHash) {
      // Add delay to prevent brute force attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

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

