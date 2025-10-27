// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import LoadingState from '@/app/components/LoadingState';
import { brandCard, brandContainer, brandHeading, brandPage, cx, subtleText } from '@/lib/theme';

export const dynamic = 'force-dynamic';

type Counts = {
  teams: number;
  players: number;
  events: number;
  terms: number;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [counts, setCounts] = useState<Counts>({ teams: 0, players: 0, events: 0, terms: 0 });

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMsg(null);

      const [teams, players, events, terms] = await Promise.all([
        getSupabaseClient().from('teams').select('*', { count: 'exact', head: true }),
        getSupabaseClient().from('players').select('*', { count: 'exact', head: true }),
        getSupabaseClient().from('events').select('*', { count: 'exact', head: true }),
        getSupabaseClient().from('terms').select('*', { count: 'exact', head: true }),
      ]);

      const err = teams.error || players.error || events.error || terms.error;
      if (err) {
        setMsg(err.message);
        setCounts({ teams: 0, players: 0, events: 0, terms: 0 });
      } else {
        setCounts({
          teams: teams.count ?? 0,
          players: players.count ?? 0,
          events: events.count ?? 0,
          terms: terms.count ?? 0,
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <main className={brandPage}>
        <div className={brandContainer}>
          <LoadingState message="Loading dashboard…" />
        </div>
      </main>
    );
  }

  return (
    <main className={brandPage}>
      <div className={brandContainer}>
        <header className={cx(brandCard, 'p-6')}>
          <h1 className={cx(brandHeading, 'text-3xl')}>Dashboard</h1>
          <p className={cx('mt-1 text-sm', subtleText)}>Quick overview and shortcuts.</p>
        </header>

        {msg && (
          <div className={cx(brandCard, 'p-4 text-sm text-[#742348] border border-[#F289AE]/40 bg-[#F289AE]/20')}>
            {msg}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Teams" value={counts.teams} href="/teams" />
          <StatCard label="Players" value={counts.players} href="/players" />
          <StatCard label="Events" value={counts.events} href="/events" />
          <StatCard label="Terms" value={counts.terms} href="/terms" />
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <QuickLink
            title="Manage fees"
            description="Set team fees for the active term."
            href="/teams"
            cta="Go to Teams"
          />
          <QuickLink
            title="Create event"
            description="Add trainings, games, or meetings."
            href="/events/new"
            cta="New event"
          />
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className={cx(brandCard, 'p-5 hover:opacity-95 transition')}>
      <div className={cx(subtleText, 'text-xs uppercase tracking-wide')}>{label}</div>
      <div className="mt-1 text-3xl font-extrabold text-[#0f1f3b]">{value}</div>
    </Link>
  );
}

function QuickLink({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className={cx(brandCard, 'p-5')}>
      <h2 className="text-lg font-semibold text-[#0f1f3b]">{title}</h2>
      <p className={cx('mt-1 text-sm', subtleText)}>{description}</p>
      <Link href={href} className="mt-3 inline-block underline decoration-2 underline-offset-4">
        {cta}
      </Link>
    </div>
  );
}
