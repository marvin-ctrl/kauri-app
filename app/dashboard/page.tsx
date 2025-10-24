'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      setEmail(user.email ?? null);
      setReady(true);
    })();
  }, []);

  if (!ready) return <main className="min-h-screen grid place-items-center">Loading…</main>;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
            <p className="text-sm text-neutral-600">{email}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/events/new" className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold">
              New event
            </Link>
            <Link href="/events" className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold">
              View events
            </Link>
          </div>
        </header>

        {/* Quick links */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/events" className="block bg-white border border-neutral-200 rounded-xl p-4 hover:bg-neutral-50">
            <h3 className="font-bold">Events</h3>
            <p className="text-sm text-neutral-600">See and take roll</p>
          </Link>
          <Link href="/teams" className="block bg-white border border-neutral-200 rounded-xl p-4 hover:bg-neutral-50">
            <h3 className="font-bold">Teams</h3>
            <p className="text-sm text-neutral-600">Manage rosters</p>
          </Link>
          <Link href="/players" className="block bg-white border border-neutral-200 rounded-xl p-4 hover:bg-neutral-50">
            <h3 className="font-bold">Players</h3>
            <p className="text-sm text-neutral-600">Add and assign</p>
          </Link>
          <Link href="/terms" className="block bg-white border border-neutral-200 rounded-xl p-4 hover:bg-neutral-50">
            <h3 className="font-bold">Terms</h3>
            <p className="text-sm text-neutral-600">Select current term</p>
          </Link>
        </section>
      </div>
    </main>
  );
}
