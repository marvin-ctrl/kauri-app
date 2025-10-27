'use client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

// Singleton instance for module-level usage (use sparingly)
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Handle missing env vars during build
  if (!url || !key) {
    if (typeof window === 'undefined') {
      // During build/server-side, return a mock that won't be used
      return null as any;
    }
    throw new Error('Missing Supabase environment variables');
  }

  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(url, key);
  }
  return supabaseInstance;
}

// Hook for use in React components - creates stable client instance
export function useSupabase() {
  return useMemo(() => getSupabaseClient(), []);
}

// Safe createClient wrapper that handles build-time gracefully
export function createClient(url?: string, key?: string) {
  // If called with explicit params, use them
  if (url && key) {
    return createSupabaseClient(url, key);
  }

  // Otherwise use env vars with build-time safety
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Handle missing env vars during build
  if (!envUrl || !envKey) {
    if (typeof window === 'undefined') {
      // During build/server-side, return a mock that won't be used
      return null as any;
    }
    throw new Error('Missing Supabase environment variables');
  }

  return createSupabaseClient(envUrl, envKey);
}
