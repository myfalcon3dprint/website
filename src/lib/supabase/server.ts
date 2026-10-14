import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Returns privileged server Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Reserved strictly for trusted API routes, webhooks, and internal jobs.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!supabaseUrl || !serviceRoleKey || !supabaseUrl.startsWith('http')) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Returns standard server client with anon key for public server queries.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!supabaseUrl || !anonKey || !supabaseUrl.startsWith('http')) {
    return null;
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
    },
  });
}
