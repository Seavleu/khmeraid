#!/usr/bin/env node

/**
 * Generate password hash for admin authentication
 * Usage: node scripts/generate-password-hash.js <password>
 */

const crypto = require('crypto');

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/generate-password-hash.js <password>');
  process.exit(1);
}

const hash = crypto.createHash('sha256').update(password).digest('hex');

console.log('\nPassword Hash Generated:');
console.log('='.repeat(50));
console.log(hash);
console.log('='.repeat(50));
console.log('\nAdd this to your .env file:');
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);

