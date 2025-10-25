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

  if (!ready) return <main className="min-h-screen grid place-items-center bg-white"><div className="text-black text-xl font-bold">Loading…</div></main>;

  return (
    <main className="min-h-screen p-6 bg-white">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between bg-white rounded-xl shadow-sm border-4 border-black p-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-black" style={{ fontFamily: 'Oswald, sans-serif' }}>DASHBOARD</h1>
            <p className="text-sm text-black mt-1 font-semibold">{email}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/events/new" className="px-4 py-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-md hover:shadow-lg transition-all border-2 border-black">
              New Event
            </Link>
            <Link href="/events" className="px-4 py-3 rounded-lg bg-white border-2 border-black hover:bg-neutral-100 text-black font-bold transition-all">
              View Events
            </Link>
          </div>
        </header>

        {/* Quick links */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/events" className="group block bg-white border-4 border-black hover:bg-neutral-50 rounded-xl p-6 hover:shadow-lg transition-all transform hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-black" style={{ fontFamily: 'Oswald, sans-serif' }}>EVENTS</h3>
            </div>
            <p className="text-sm text-black font-medium">View schedule and take roll</p>
          </Link>

          <Link href="/teams" className="group block bg-white border-4 border-black hover:bg-neutral-50 rounded-xl p-6 hover:shadow-lg transition-all transform hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-black" style={{ fontFamily: 'Oswald, sans-serif' }}>TEAMS</h3>
            </div>
            <p className="text-sm text-black font-medium">Manage team rosters</p>
          </Link>

          <Link href="/players" className="group block bg-white border-4 border-black hover:bg-neutral-50 rounded-xl p-6 hover:shadow-lg transition-all transform hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-black" style={{ fontFamily: 'Oswald, sans-serif' }}>PLAYERS</h3>
            </div>
            <p className="text-sm text-black font-medium">Add and manage players</p>
          </Link>

          <Link href="/terms" className="group block bg-white border-4 border-black hover:bg-neutral-50 rounded-xl p-6 hover:shadow-lg transition-all transform hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-black" style={{ fontFamily: 'Oswald, sans-serif' }}>TERMS</h3>
            </div>
            <p className="text-sm text-black font-medium">Manage school terms</p>
          </Link>
        </section>
      </div>
    </main>
  );
}
