'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Team = { id: string; name: string };

export default function TeamsPage() {
  const [rows, setRows] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('teams')
      .select('id,name')
      .order('name', { ascending: true });
    if (error) setMsg(error.message);
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function removeTeam(id: string) {
    setMsg(null);
    if (!confirm('Delete this team? Related memberships and team-term shells will be removed.')) return;
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) { setMsg(`Error: ${error.message}`); return; }
    await load();
  }

  if (loading) return <main className="min-h-screen grid place-items-center">Loading…</main>;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Teams</h1>
          <Link href="/teams/new" className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold">
            New team
          </Link>
        </header>

        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 border-b border-neutral-200">
              <tr className="text-black">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(t => (
                <tr key={t.id} className="border-b border-neutral-100 hover:bg-neutral-50 text-black">
                  <td className="p-3">{t.name}</td>
                  <td className="p-3">
                    <Link href={`/teams/${t.id}/roster`} className="underline text-blue-700 hover:text-blue-800">Roster</Link>
                    <span className="mx-2 text-black">|</span>
                    <Link href={`/teams/${t.id}/assign`} className="underline text-blue-700 hover:text-blue-800">Assign</Link>
                    <span className="mx-2 text-black">|</span>
                    <button onClick={() => removeTeam(t.id)} className="text-red-700 underline">Delete</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td className="p-4 text-black" colSpan={2}>No teams.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        {msg && <p className="text-sm text-red-800">{msg}</p>}
      </div>
    </main>
  );
}
