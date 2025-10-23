'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Player = {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  jersey_no: number | null;
  status: string | null;
};

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all'|'prospect'|'active'|'inactive'|'alumni'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('players')
        .select('id, first_name, last_name, preferred_name, jersey_no, status')
        .order('last_name', { ascending: true });
      setPlayers(error ? [] : (data || []));
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return players.filter(p => {
      const okStatus = status === 'all' || (p.status || 'active') === status;
      const name = `${p.first_name} ${p.last_name} ${p.preferred_name || ''}`.toLowerCase();
      return okStatus && (term ? name.includes(term) : true);
    });
  }, [players, q, status]);

  if (loading) return <main className="min-h-screen grid place-items-center">Loading…</main>;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Players</h1>
          <Link href="/players/new" className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold">
            Add player
          </Link>
        </header>

        <div className="flex flex-wrap gap-3 items-center">
          <input
            placeholder="Search name…"
            value={q}
            onChange={e=>setQ(e.target.value)}
            className="border border-neutral-300 rounded-md px-3 py-2 bg-white"
          />
          <select
            value={status}
            onChange={e=>setStatus(e.target.value as any)}
            className="border border-neutral-300 rounded-md px-3 py-2 bg-white"
          >
            <option value="all">All</option>
            <option value="prospect">Prospect</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="alumni">Alumni</option>
          </select>
        </div>

        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-100">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Jersey</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const display = p.preferred_name || `${p.first_name} ${p.last_name}`;
                return (
                  <tr key={p.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="p-3">
                      <Link href={`/players/${p.id}`} className="underline text-blue-700 hover:text-blue-800">
                        {display}
                      </Link>
                    </td>
                    <td className="p-3">{p.jersey_no ?? '—'}</td>
                    <td className="p-3">{p.status || 'active'}</td>
                    <td className="p-3">
                      <Link href={`/players/${p.id}/edit`} className="underline text-blue-700 hover:text-blue-800">
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td className="p-4 text-neutral-700" colSpan={4}>No players.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
