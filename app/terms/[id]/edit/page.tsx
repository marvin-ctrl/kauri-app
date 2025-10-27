'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import LoadingState from '@/app/components/LoadingState';
import {
  brandCard,
  brandContainer,
  brandHeading,
  brandPage,
  cx,
  dangerActionButton,
  primaryActionButton,
  secondaryActionButton,
  subtleText
} from '@/lib/theme';

export const dynamic = 'force-dynamic';

type Term = { id: string; year: number; term: number; start_date: string | null; end_date: string | null };

export default function EditTermPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
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

  if (loading) {
    return (
      <main className={brandPage}>
        <LoadingState message="Loading term…" />
      </main>
    );
  }

  return (
    <main className={brandPage}>
      <div className={brandContainer}>
        <div className={cx(brandCard, 'mx-auto flex w-full max-w-lg flex-col gap-6 p-6 sm:p-8')}>
          <header className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h1 className={cx(brandHeading, 'text-3xl sm:text-4xl')}>Edit term</h1>
                {row && (
                  <p className={cx('text-sm', subtleText)}>
                    {row.year} · Term {row.term}
                  </p>
                )}
              </div>
              <a href="/terms" className={secondaryActionButton}>Back to terms</a>
            </div>
            {msg && (
              <div className="rounded-2xl border border-[#F289AE]/40 bg-[#F289AE]/20 px-4 py-3 text-sm text-[#742348]">
                {msg}
              </div>
            )}
          </header>

          <form onSubmit={save} className="space-y-5">
            <label className="block text-sm font-semibold text-[#172F56]">
              Year
              <input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#172F56] shadow-inner focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/50"
              />
            </label>
            <label className="block text-sm font-semibold text-[#172F56]">
              Term (1–4)
              <input
                type="number"
                min={1}
                max={4}
                value={term}
                onChange={e => setTerm(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#172F56] shadow-inner focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/50"
              />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-[#172F56]">
                Start date
                <input
                  type="date"
                  value={start}
                  onChange={e => setStart(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#172F56] shadow-inner focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/50"
                />
              </label>
              <label className="block text-sm font-semibold text-[#172F56]">
                End date
                <input
                  type="date"
                  value={end}
                  onChange={e => setEnd(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#172F56] shadow-inner focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/50"
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button type="submit" disabled={saving} className={cx(primaryActionButton, 'w-full sm:w-auto disabled:opacity-60')}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" onClick={del} className={cx(dangerActionButton, 'w-full sm:w-auto')}>
                Delete term
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
