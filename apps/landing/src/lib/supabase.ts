import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
function getSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      `Missing Supabase environment variables. URL: ${supabaseUrl ? 'set' : 'MISSING'}, Anon Key: ${supabaseAnonKey ? 'set' : 'MISSING'}`
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

function getSupabaseAdminClient(): SupabaseClient {
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  const key = supabaseServiceKey || supabaseAnonKey;
  if (!key) {
    throw new Error('Missing Supabase key (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  }
  return createClient(supabaseUrl, key);
}

// Client-side Supabase client (uses anon key)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as SupabaseClient);

// Server-side Supabase client (uses service role key for admin access)
export const supabaseAdmin = supabaseUrl && (supabaseServiceKey || supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey!)
  : (null as unknown as SupabaseClient);

// Export functions for lazy initialization with better error messages
export { getSupabaseClient, getSupabaseAdminClient };
