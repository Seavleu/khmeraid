import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Only throw error in production if required vars are missing
if (process.env.NODE_ENV === 'production' && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required');
}

// Client-side Supabase client (for browser use)
let supabaseClient: SupabaseClient | null = null;

export const supabase: SupabaseClient = (() => {
  if (!supabaseClient) {
    supabaseClient = supabaseUrl && supabaseAnonKey 
      ? createClient(supabaseUrl, supabaseAnonKey)
      : createClient('https://placeholder.supabase.co', 'placeholder-key');
  }
  return supabaseClient;
})();

// Server-side Supabase client with service role key (for database operations)
// This bypasses Row Level Security (RLS) and has full database access
export function getSupabaseServerClient(): SupabaseClient {
  if (!supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  
  try {
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  } catch (error) {
    console.error('Error creating Supabase server client:', error);
    throw error;
  }
}

// Legacy alias for backward compatibility
export const createServerClient = getSupabaseServerClient;

