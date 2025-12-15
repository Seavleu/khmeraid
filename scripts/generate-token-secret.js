#!/usr/bin/env node

/**
 * Generate secure token secret for admin authentication
 * Usage: node scripts/generate-token-secret.js
 */

const crypto = require('crypto');

const secret = crypto.randomBytes(32).toString('hex');

console.log('\nToken Secret Generated:');
console.log('='.repeat(50));
console.log(secret);
console.log('='.repeat(50));
console.log('\nAdd this to your .env file:');
console.log(`ADMIN_TOKEN_SECRET=${secret}\n`);
console.log('⚠️  Keep this secret secure and never commit it to version control!\n');

