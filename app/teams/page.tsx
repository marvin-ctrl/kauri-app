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
          <h1 className="text-3xl font-extrabold tracking-tight text-black">Teams</h1>
          <Link href="/teams/new" className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-bold border-2 border-black">
            New team
          </Link>
        </header>

        <section className="bg-white border-2 border-black rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="text-left p-3 font-bold">Name</th>
                <th className="text-left p-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(t => (
                <tr key={t.id} className="border-b-2 border-neutral-200 hover:bg-neutral-50">
                  <td className="p-3 font-semibold text-black">{t.name}</td>
                  <td className="p-3">
                    <Link href={`/teams/${t.id}/edit`} className="underline text-blue-700 hover:text-blue-800 font-bold">Edit</Link>
                    <span className="mx-2 text-black">|</span>
                    <Link href={`/teams/${t.id}/roster`} className="underline text-blue-700 hover:text-blue-800 font-bold">Roster</Link>
                    <span className="mx-2 text-black">|</span>
                    <Link href={`/teams/${t.id}/assign`} className="underline text-blue-700 hover:text-blue-800 font-bold">Assign</Link>
                    <span className="mx-2 text-black">|</span>
                    <button onClick={() => removeTeam(t.id)} className="text-red-700 underline font-bold hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td className="p-4 text-black font-semibold" colSpan={2}>No teams.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        {msg && <p className="text-sm text-red-800">{msg}</p>}
      </div>
    </main>
  );
}
