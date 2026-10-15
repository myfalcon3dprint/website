if (process.env.TEST_SERVER_MODE === 'isolated_local') {
  // Enforce isolated local database and storage targets, overriding any values from .env.local
  process.env.DATABASE_URL = process.env.ISOLATED_DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.ISOLATED_SUPABASE_URL || 'http://127.0.0.1:54321';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.ISOLATED_ANON_KEY || 'dummy_local_anon_key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.ISOLATED_SERVICE_ROLE_KEY || 'dummy_local_service_key';
  process.env.STORAGE_PROVIDER = 'supabase';
  process.env.ALLOW_LOCAL_STORAGE_FALLBACK = process.env.ISOLATED_ALLOW_LOCAL_STORAGE_FALLBACK || process.env.ALLOW_LOCAL_STORAGE_FALLBACK || 'false';
  process.env.ENABLE_TEST_HARNESS = 'true';
  // Disable external services
  process.env.R2_ACCESS_KEY_ID = '';
  process.env.R2_SECRET_ACCESS_KEY = '';
  process.env.R2_BUCKET_NAME = '';
  process.env.R2_ENDPOINT = '';
  process.env.CLOUDFLARE_API_TOKEN = '';
  process.env.RAZORPAY_KEY_ID = 'rzp_test_isolated_dummy';
  process.env.RAZORPAY_KEY_SECRET = 'rzp_sec_isolated_dummy';
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
