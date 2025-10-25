'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Term = { id: string; year: number; term: number; start_date: string | null; end_date: string | null };

export default function TermsPage() {
  const [rows, setRows] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    const { data, error } = await supabase.from('terms').select('id,year,term,start_date,end_date').order('year', { ascending: false }).order('term', { ascending: true });
    if (error) {
      setMsg(`Error loading terms: ${error.message}`);
    }
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <main className="min-h-screen grid place-items-center">Loading…</main>;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Terms</h1>
          <Link href="/terms/new" className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold">New term</Link>
        </header>

        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-100">
              <tr>
                <th className="text-left p-3">Year</th>
                <th className="text-left p-3">Term</th>
                <th className="text-left p-3">Dates</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(t => (
                <tr key={t.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="p-3">{t.year}</td>
                  <td className="p-3">Term {t.term}</td>
                  <td className="p-3">
                    {(t.start_date ? new Date(t.start_date).toLocaleDateString('en-NZ') : '—') + ' → ' +
                     (t.end_date ? new Date(t.end_date).toLocaleDateString('en-NZ') : '—')}
                  </td>
                  <td className="p-3">
                    <Link href={`/terms/${t.id}/edit`} className="underline text-blue-700 hover:text-blue-800">Edit</Link>
                    <button
                      onClick={async () => {
                        if (!confirm('Delete this term?')) return;
                        setDeletingId(t.id);
                        setMsg(null);
                        try {
                          const { error } = await supabase.from('terms').delete().eq('id', t.id);
                          if (error) throw error;
                          await load();
                        } catch (err) {
                          const message = err instanceof Error ? err.message : 'Unknown error';
                          setMsg(`Error deleting term: ${message}`);
                        } finally {
                          setDeletingId(null);
                        }
                      }}
                      disabled={deletingId === t.id}
                      className="ml-3 text-red-700 underline disabled:opacity-50"
                    >
                      {deletingId === t.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td className="p-4 text-neutral-800" colSpan={4}>No terms.</td></tr>}
            </tbody>
          </table>
        </section>

        {msg && <p className="text-sm text-red-800">{msg}</p>}
      </div>
    </main>
  );
}
