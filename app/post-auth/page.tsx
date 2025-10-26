'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/supabase';
import { AUTH, ROUTES } from '@/lib/constants';

export default function PostAuth() {
  const router = useRouter();
  const supabase = useSupabase();

  useEffect(() => {
    let cancelled = false;
    const timeouts: NodeJS.Timeout[] = [];

    (async () => {
      for (let i = 0; i < AUTH.SESSION_POLL_MAX_ATTEMPTS; i++) {
        if (cancelled) break;

        const { data: { session } } = await supabase.auth.getSession();
        if (session) break;

        await new Promise(r => {
          const timeout = setTimeout(r, AUTH.SESSION_POLL_INTERVAL_MS);
          timeouts.push(timeout);
        });
      }

      if (cancelled) return;

      const { data: { user } } = await supabase.auth.getUser();
      router.replace(user ? ROUTES.DASHBOARD : ROUTES.LOGIN);
    })();

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [router, supabase]);

  return (
    <main className="min-h-screen grid place-items-center bg-neutral-50 text-neutral-900">
      <div className="bg-white border border-neutral-200 rounded-md px-4 py-2">
        Finishing sign-in…
      </div>
    </main>
  );
}
