'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Term = { id: string; year: number; term: number; start_date: string | null; end_date: string | null };

export default function EditTermPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [row, setRow] = useState<Term | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [term, setTerm] = useState<number>(1);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('terms').select('id,year,term,start_date,end_date').eq('id', id).maybeSingle();
      if (error || !data) { setMsg(error ? `Error: ${error.message}` : 'Not found'); setLoading(false); return; }
      setRow(data); setYear(data.year); setTerm(data.term);
      setStart(data.start_date || ''); setEnd(data.end_date || '');
      setLoading(false);
    })();
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(null); setSaving(true);
    const { error } = await supabase.from('terms').update({
      year, term, start_date: start || null, end_date: end || null
    }).eq('id', id);
    setSaving(false);
    if (error) { setMsg(`Error: ${error.message}`); return; }
    // if the edited term is the selected one, keep it; else nothing to change
    router.replace('/terms');
  }

  async function del() {
    if (!confirm('Delete this term? This removes shell links but not teams/players.')) return;
    const { error } = await supabase.from('terms').delete().eq('id', id);
    if (error) { setMsg(`Error: ${error.message}`); return; }
    // clear selection if it was this term
    if (localStorage.getItem('kauri.termId') === id) localStorage.removeItem('kauri.termId');
    router.replace('/terms');
  }

  if (loading) return <main className="min-h-screen grid place-items-center">Loading…</main>;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-md mx-auto bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-5">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Edit term</h1>
          <a href="/terms" className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold">Back</a>
        </header>

        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm font-medium">
            Year
            <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))} className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"/>
          </label>
          <label className="block text-sm font-medium">
            Term (1–4)
            <input type="number" min={1} max={4} value={term} onChange={e=>setTerm(Number(e.target.value))} className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"/>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Start date
              <input type="date" value={start} onChange={e=>setStart(e.target.value)} className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"/>
            </label>
            <label className="block text-sm font-medium">
              End date
              <input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"/>
            </label>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-md px-3 py-2 font-semibold disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={del} className="px-3 py-2 rounded-md bg-red-700 hover:bg-red-800 text-white font-semibold">
              Delete
            </button>
          </div>

          {msg && <div className="text-sm text-red-800">{msg}</div>}
        </form>
      </div>
    </main>
  );
}
