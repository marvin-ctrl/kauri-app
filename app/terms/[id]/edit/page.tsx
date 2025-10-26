'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import LoadingState from '@/app/components/LoadingState';
import ConfirmationModal from '@/app/components/ConfirmationModal';
import { useToast } from '@/app/components/ToastProvider';
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Term = { id: string; year: number; term: number; start_date: string | null; end_date: string | null };

export default function EditTermPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [row, setRow] = useState<Term | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [term, setTerm] = useState<number>(1);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('terms').select('id,year,term,start_date,end_date').eq('id', id).maybeSingle();
      if (error || !data) {
        toast.error(error ? `Error: ${error.message}` : 'Term not found');
        setLoading(false);
        return;
      }
      setRow(data); setYear(data.year); setTerm(data.term);
      setStart(data.start_date || ''); setEnd(data.end_date || '');
      setLoading(false);
    })();
  }, [id, toast]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('terms').update({
      year, term, start_date: start || null, end_date: end || null
    }).eq('id', id);
    setSaving(false);
    if (error) {
      toast.error(`Error: ${error.message}`);
      return;
    }
    toast.success('Term updated successfully!');
    router.replace('/terms');
  }

  async function handleDelete() {
    const { error } = await supabase.from('terms').delete().eq('id', id);
    if (error) {
      toast.error(`Error: ${error.message}`);
      return;
    }
    // clear selection if it was this term
    if (localStorage.getItem('kauri.termId') === id) localStorage.removeItem('kauri.termId');
    toast.success('Term deleted successfully');
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
              <button type="button" onClick={() => setShowDeleteModal(true)} className={cx(dangerActionButton, 'w-full sm:w-auto')}>
                Delete term
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete term?"
        message="This will remove links to teams and events, but won't delete the teams or players themselves. This action cannot be undone."
        confirmLabel="Delete term"
        variant="danger"
      />
    </main>
  );
}
