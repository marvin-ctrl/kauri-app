'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PostAuth() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Let Supabase parse the URL fragment and persist session
      // A couple of polls handles slow email redirects
      for (let i = 0; i < 10; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) break;
        await new Promise(r => setTimeout(r, 300));
      }

      if (cancelled) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) router.replace('/dashboard');
      else router.replace('/login');
    })();

    return () => { cancelled = true; };
  }, [router]);

  return (
    <main className="min-h-screen grid place-items-center">
      <div>Finishing sign-in…</div>
    </main>
  );
}
