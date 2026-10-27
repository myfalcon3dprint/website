import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

import { SUPABASE_URL as supabaseUrl, SUPABASE_ANON_KEY as supabaseAnonKey } from './config';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your_supabase_url')
  );
};

let browserClient: SupabaseClient | null = null;

/**
 * Returns browser-safe Supabase client configured with public anon key and cookie synchronization.
 * If credentials are not set, returns null to allow seamless offline preview fallback.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!browserClient) {
    try {
      browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
    } catch {
      return null;
    }
  }

  return browserClient;
}

export const createClient = (): SupabaseClient | null => {
  return getSupabaseBrowserClient();
};

export default getSupabaseBrowserClient;

