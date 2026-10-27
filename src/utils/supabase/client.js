import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your_supabase_url')
  );
};

let browserClient = null;

export function getSupabaseBrowserClient() {
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

export const createClient = () => {
  return getSupabaseBrowserClient();
};

export default getSupabaseBrowserClient;
