'use client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

// Singleton instance for module-level usage (use sparingly)
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    // Only create client if we have valid credentials
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
      );
    }

    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseKey);
  }
  return supabaseInstance;
}

// Hook for use in React components - creates stable client instance
export function useSupabase() {
  return useMemo(() => getSupabaseClient(), []);
}

// Lazy export for non-component usage (e.g., event handlers)
// Note: This will throw if environment variables are not set
export function getSupabase() {
  return getSupabaseClient();
}
