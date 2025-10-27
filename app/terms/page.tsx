'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import LoadingState from '@/app/components/LoadingState';
import EmptyState from '@/app/components/EmptyState';
import {
  brandCard,
  brandContainer,
  brandHeading,
  brandPage,
  brandTableCard,
  cx,
  primaryActionButton,
  subtleText
} from '@/lib/theme';

export const dynamic = 'force-dynamic';

type Term = { id: string; year: number; term: number; start_date: string | null; end_date: string | null };

export default function TermsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [rows, setRows] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('terms').select('id,year,term,start_date,end_date').order('year', { ascending: false }).order('term', { ascending: true });
      setRows(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <main className={brandPage}>
        <LoadingState message="Loading terms…" />
      </main>
    );
  }

  return (
    <main className={brandPage}>
      <div className={brandContainer}>
        <header className={cx(brandCard, 'flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between')}>
          <div className="space-y-1">
            <h1 className={cx(brandHeading, 'text-3xl sm:text-4xl')}>Terms</h1>
            <p className={cx('text-sm', subtleText)}>Track school terms to tie events, fees, and teams together.</p>
          </div>
          <Link href="/terms/new" className={primaryActionButton}>
            New term
          </Link>
        </header>

        {rows.length > 0 ? (
          <section className={cx(brandTableCard, 'overflow-hidden')}>
            <table className="w-full text-sm">
              <thead className="border-b border-white/40 bg-white/40 text-[#0f1f3b]">
                <tr>
                  <th className="text-left px-4 py-3">Year</th>
                  <th className="text-left px-4 py-3">Term</th>
                  <th className="text-left px-4 py-3">Dates</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(t => (
                  <tr key={t.id} className="border-b border-white/20 bg-white/60 text-[#0f1f3b] last:border-0">
                    <td className="px-4 py-3 font-semibold text-[#172F56]">{t.year}</td>
                    <td className="px-4 py-3">Term {t.term}</td>
                    <td className="px-4 py-3">
                      {(t.start_date ? new Date(t.start_date).toLocaleDateString('en-NZ') : '—') + ' → ' +
                        (t.end_date ? new Date(t.end_date).toLocaleDateString('en-NZ') : '—')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#172F56]">
                        <Link href={`/terms/${t.id}/edit`} className="underline decoration-2 underline-offset-4 hover:text-[#0b1730]">
                          Edit
                        </Link>
                        <span className="text-white/40">•</span>
                        <button
                          onClick={async () => {
                            if (!confirm('Delete this term?')) return;
                            await supabase.from('terms').delete().eq('id', t.id);
                            location.reload();
                          }}
                          className="text-[#c41d5e] underline decoration-2 underline-offset-4 transition hover:text-[#9b1549]"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <EmptyState
            icon="🗓️"
            title="No terms set up"
            description="Add the current school term so you can organise competitions and fees."
            action={<Link href="/terms/new" className={primaryActionButton}>Add a term</Link>}
          />
        )}
      </div>
    </main>
  );
}
