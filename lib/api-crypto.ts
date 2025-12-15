import crypto from 'crypto';

// API encryption key (should be in environment variables)
const API_ENCRYPTION_KEY = process.env.API_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const API_SECRET = process.env.API_SECRET || crypto.randomBytes(32).toString('hex');

// Generate encryption key from secret
function getEncryptionKey(): Buffer {
  return crypto.createHash('sha256').update(API_SECRET).digest();
}

// Encrypt data
export function encryptData(data: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Prepend IV to encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt data
export function decryptData(encryptedData: string): string {
  const key = getEncryptionKey();
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Generate API token
export function generateApiToken(payload: Record<string, any>): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  
  const tokenData = {
    ...payload,
    timestamp,
    random,
    exp: timestamp + (60 * 60 * 1000), // 1 hour expiration
  };
  
  // Create HMAC signature
  const signature = crypto
    .createHmac('sha256', API_SECRET)
    .update(JSON.stringify(tokenData))
    .digest('hex');
  
  // Combine and encrypt
  const token = JSON.stringify({ ...tokenData, signature });
  return encryptData(token);
}

// Verify API token
export function verifyApiToken(token: string): { valid: boolean; payload?: any } {
  try {
    // Decrypt token
    const decrypted = decryptData(token);
    const data = JSON.parse(decrypted);
    
    // Check expiration
    if (Date.now() > data.exp) {
      return { valid: false };
    }
    
    // Extract signature
    const { signature, ...payload } = data;
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', API_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return { valid: false };
    }
    
    return { valid: true, payload };
  } catch (error) {
    return { valid: false };
  }
}

// Generate request ID for tracking
export function generateRequestId(): string {
  return crypto.randomBytes(16).toString('hex');
}

