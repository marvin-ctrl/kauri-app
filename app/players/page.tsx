'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/lib/supabase';
import { useAuthGuard } from '@/lib/auth-guard';

type Player = {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  jersey_no: number | null;
  created_at: string | null;
};

export default function PlayersPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuthGuard();
  const [rows, setRows] = useState<Player[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const supabase = useSupabase();

  const load = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    const { data, error } = await supabase
      .from('players')
      .select('id, first_name, last_name, preferred_name, jersey_no, created_at')
      .order('created_at', { ascending: false });
    if (error) setMsg(error.message);
    setRows(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (isAuthenticated) {
      load();
    }
  }, [isAuthenticated, load]);

  const filtered = rows.filter(p => {
    const term = q.trim().toLowerCase();
    if (!term) return true;
    const name = `${p.first_name} ${p.last_name} ${p.preferred_name || ''}`.toLowerCase();
    return name.includes(term) || String(p.jersey_no ?? '').includes(term);
  });

  if (authLoading || loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="h-12 bg-neutral-200 rounded animate-pulse" />
          <div className="h-64 bg-neutral-200 rounded animate-pulse" />
        </div>
      </main>
    );
  }

  if (!isAuthenticated) return null;

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
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Jersey</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const name = p.preferred_name || `${p.first_name} ${p.last_name}`;
                return (
                  <tr key={p.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="p-3">{name}</td>
                    <td className="p-3">{p.jersey_no ?? '—'}</td>
                    <td className="p-3">
                      {/* REAL links using p.id */}
                      <Link href={`/players/${p.id}`} className="underline text-blue-700 hover:text-blue-800">View</Link>
                      <span className="mx-2 text-neutral-300">|</span>
                      <Link href={`/players/${p.id}/assign`} className="underline text-blue-700 hover:text-blue-800">Assign to teams</Link>
                      <span className="mx-2 text-neutral-300">|</span>
                      <Link href={`/players/${p.id}/edit`} className="underline text-blue-700 hover:text-blue-800">Edit</Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td className="p-4 text-neutral-700" colSpan={3}>No players.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        {msg && <p className="text-sm text-red-800">{msg}</p>}
      </div>
    </main>
  );
}
