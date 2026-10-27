/**
 * Supabase Public Configuration Defaults
 *
 * Provides authoritative fallback configuration for public Supabase endpoints and anon keys.
 * Enables reliable client-side hydration and SSR execution even when build environment
 * variables are not explicitly injected by CI runners.
 */

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wkkoviqhmccjnocjfudq.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indra292aXFobWNjam5vY2pmdWRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MTY0ODYsImV4cCI6MjEwNzI5MjQ4Nn0.MK9cn5kqom-GvaZTV-7__imhPd-Y_2r2rH3TOi0Zdfc';
