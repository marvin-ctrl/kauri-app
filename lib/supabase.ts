'use client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

// Singleton instance for module-level usage (use sparingly)
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseInstance;
}

// Hook for use in React components - creates stable client instance
export function useSupabase() {
  return useMemo(() => getSupabaseClient(), []);
}

// Export for non-component usage (e.g., event handlers)
export const supabase = getSupabaseClient();
