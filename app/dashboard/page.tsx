'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/supabase';
import DashboardCard from '@/app/components/DashboardCard';

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const supabase = useSupabase();

  useEffect(() => {
    (async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      // Handle errors (network issues, etc.)
      if (error) {
        console.error('Auth error:', error);
        router.push('/login');
        return;
      }

      // Handle not authenticated
      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email ?? null);
      setReady(true);
    })();
  }, [router, supabase]);

  if (!ready) {
    return (
      <main className="min-h-screen grid place-items-center bg-gradient-to-br from-[#172F56] to-[#79CBC4]">
        <div className="text-white text-xl">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-white via-[#f8fffe] to-[#f0faf9]">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#172F56] font-brand">
              DASHBOARD
            </h1>
            <p className="text-sm text-[#5a718f] mt-1 font-medium">{email}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/events/new"
              className="px-4 py-3 rounded-lg bg-[#79CBC4] hover:bg-[#68b8b0] text-white font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              New Event
            </Link>
            <Link
              href="/events"
              className="px-4 py-3 rounded-lg bg-white border-2 border-[#79CBC4] hover:bg-[#79CBC4] text-[#172F56] hover:text-white font-bold transition-all"
            >
              View Events
            </Link>
          </div>
        </header>

        {/* Quick links */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard
            href="/events"
            emoji="📅"
            title="EVENTS"
            description="View schedule and take roll"
            color="seafoam"
          />
          <DashboardCard
            href="/teams"
            emoji="👥"
            title="TEAMS"
            description="Manage team rosters"
            color="taffy"
          />
          <DashboardCard
            href="/players"
            emoji="⚽"
            title="PLAYERS"
            description="Add and manage players"
            color="seafoam"
          />
          <DashboardCard
            href="/terms"
            emoji="🗓️"
            title="TERMS"
            description="Manage school terms"
            color="taffy"
          />
        </section>
      </div>
    </main>
  );
}
