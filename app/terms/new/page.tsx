'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NewTermPage() {
  const router = useRouter();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [term, setTerm] = useState<number>(1);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(null); setSaving(true);
    const { error } = await supabase.from('terms').insert({
      year, term, start_date: start || null, end_date: end || null
    });
    setSaving(false);
    if (error) { setMsg(`Error: ${error.message}`); return; }
    router.replace('/terms');
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-md mx-auto bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-5">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">New term</h1>
          <a href="/terms" className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold">Cancel</a>
        </header>

        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm font-medium">
            Year
            <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))} className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900"/>
          </label>
          <label className="block text-sm font-medium">
            Term (1–4)
            <input type="number" min={1} max={4} value={term} onChange={e=>setTerm(Number(e.target.value))} className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900"/>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Start date
              <input type="date" value={start} onChange={e=>setStart(e.target.value)} className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900"/>
            </label>
            <label className="block text-sm font-medium">
              End date
              <input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900"/>
            </label>
          </div>
          <button type="submit" disabled={saving} className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-md px-3 py-2 font-semibold disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
          {msg && <div className="text-sm text-red-800">{msg}</div>}
        </form>
      </div>
    </main>
  );
}
