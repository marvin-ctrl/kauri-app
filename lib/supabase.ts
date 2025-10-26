'use client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

// Singleton instance for module-level usage (use sparingly)
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error(
        'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
      );
    }

    supabaseInstance = createSupabaseClient(url, key);
  }
  return supabaseInstance;
}

// Hook for use in React components - creates stable client instance
export function useSupabase() {
  return useMemo(() => getSupabaseClient(), []);
}

// Export for non-component usage (e.g., event handlers)
export const supabase = getSupabaseClient();
