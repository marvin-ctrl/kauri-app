/**
 * Authentication guard hook
 * Protects routes from unauthenticated access
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from './supabase';
import { ROUTES } from './constants';

export function useAuthGuard() {
  const router = useRouter();
  const supabase = useSupabase();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.push(ROUTES.LOGIN);
        return;
      }

      setIsAuthenticated(true);
      setIsLoading(false);
    })();
  }, [router, supabase]);

  return { isAuthenticated, isLoading };
}
