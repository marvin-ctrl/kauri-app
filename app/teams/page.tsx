'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Team = { id: string; name: string };

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('teams').select('id,name').order('name');
      setTeams(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <main className="min-h-screen grid place-items-center">Loading…</main>;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Teams</h1>
          <Link href="/teams/new" className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold">
            New team
          </Link>
        </header>

        <ul className="space-y-2">
          {teams.map(t => (
            <li key={t.id} className="flex items-center justify-between border border-neutral-200 rounded-lg p-3 bg-white">
              <div className="text-sm font-semibold">{t.name}</div>
              <Link href={`/teams/${t.id}/roster`} className="text-sm underline text-blue-700 hover:text-blue-800">
                View roster
              </Link>
            </li>
          ))}
          {teams.length === 0 && <li className="text-sm text-neutral-700">No teams.</li>}
        </ul>
      </div>
    </main>
  );
}
