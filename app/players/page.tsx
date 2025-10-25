'use client';

import { useEffect, useState } from 'react';
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
  created_at: string | null;
};

export default function PlayersPage() {
  const [rows, setRows] = useState<Player[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    const { data, error } = await supabase
      .from('players')
      .select('id, first_name, last_name, preferred_name, jersey_no, created_at')
      .order('created_at', { ascending: false });
    if (error) setMsg(error.message);
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = rows.filter(p => {
    const term = q.trim().toLowerCase();
    if (!term) return true;
    const name = `${p.first_name} ${p.last_name} ${p.preferred_name || ''}`.toLowerCase();
    return name.includes(term) || String(p.jersey_no ?? '').includes(term);
  });

  if (loading) return <main className="min-h-screen grid place-items-center">Loading…</main>;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Players</h1>
          <Link href="/players/new" className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold">
            New player
          </Link>
        </header>

        <div className="flex gap-3">
          <input
            value={q}
            onChange={e=>setQ(e.target.value)}
            placeholder="Search by name or jersey…"
            className="border border-neutral-300 rounded-md px-3 py-2 bg-white"
          />
        </div>

        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 border-b border-neutral-200">
              <tr className="text-black">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Jersey</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const name = p.preferred_name || `${p.first_name} ${p.last_name}`;
                return (
                  <tr key={p.id} className="border-b border-neutral-100 hover:bg-neutral-50 text-black">
                    <td className="p-3">{name}</td>
                    <td className="p-3">{p.jersey_no ?? '—'}</td>
                    <td className="p-3">
                      {/* REAL links using p.id */}
                      <Link href={`/players/${p.id}`} className="underline text-blue-700 hover:text-blue-800">View</Link>
                      <span className="mx-2 text-black">|</span>
                      <Link href={`/players/${p.id}/assign`} className="underline text-blue-700 hover:text-blue-800">Assign to teams</Link>
                      <span className="mx-2 text-black">|</span>
                      <Link href={`/players/${p.id}/edit`} className="underline text-blue-700 hover:text-blue-800">Edit</Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td className="p-4 text-black" colSpan={3}>No players.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        {msg && <p className="text-sm text-red-800">{msg}</p>}
      </div>
    </main>
  );
}
