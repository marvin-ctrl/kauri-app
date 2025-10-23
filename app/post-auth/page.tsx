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
      for (let i = 0; i < 10; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) break;
        await new Promise(r => setTimeout(r, 250));
      }
      if (cancelled) return;

      const { data: { user } } = await supabase.auth.getUser();
      router.replace(user ? '/dashboard' : '/login');
    })();

    return () => { cancelled = true; };
  }, [router]);

  return (
    <main className="min-h-screen grid place-items-center bg-neutral-50 text-neutral-900">
      <div className="bg-white border border-neutral-200 rounded-md px-4 py-2">
        Finishing sign-in…
      </div>
    </main>
  );
}
