import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7 requires the database URL to be passed via environment variable or config
// The DATABASE_URL should be set in .env file
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Handle Prisma connection errors gracefully
// Skip connection during build time
if (process.env.NEXT_PHASE !== 'phase-production-build') {
  prisma.$connect().catch((error) => {
    console.error('Failed to connect to database:', error);
    if (process.env.NODE_ENV === 'development') {
      console.warn('Make sure DATABASE_URL is set in your .env file');
      if (process.env.DATABASE_URL?.includes('pooler')) {
        console.error('❌ ERROR: DATABASE_URL is using a pooler connection!');
        console.error('Prisma requires a DIRECT connection URL.');
        console.error('Fix: Use port 5432 and host ending in .connect.supabase.co, not .pooler.supabase.com:6543');
      }
    }
  });
}

