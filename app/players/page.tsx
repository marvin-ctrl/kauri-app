'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import LoadingState from '@/app/components/LoadingState';
import EmptyState from '@/app/components/EmptyState';
import SearchInput from '@/app/components/SearchInput';
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

  if (loading) {
    return (
      <main className={brandPage}>
        <LoadingState message="Loading players…" />
      </main>
    );
  }

  return (
    <main className={brandPage}>
      <div className={brandContainer}>
        <header className={cx(brandCard, 'flex flex-col gap-6 p-6')}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className={cx(brandHeading, 'text-3xl sm:text-4xl')}>Players</h1>
              <p className={cx('text-sm', subtleText)}>Search, edit, and assign players across your club.</p>
            </div>
            <Link href="/players/new" className={primaryActionButton}>
              New player
            </Link>
          </div>

          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Search by name or jersey…"
            label="Search roster"
            id="player-search"
          />
        </header>

        {filtered.length > 0 ? (
          <section className={cx(brandTableCard, 'overflow-hidden')}>
            <table className="w-full text-sm">
              <thead className="border-b border-white/40 bg-white/40 text-[#0f1f3b]">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Jersey</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const name = p.preferred_name || `${p.first_name} ${p.last_name}`;
                  return (
                    <tr key={p.id} className="border-b border-white/20 bg-white/60 text-[#0f1f3b] last:border-0">
                      <td className="px-4 py-3 font-semibold text-[#172F56]">{name}</td>
                      <td className="px-4 py-3">{p.jersey_no ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#172F56]">
                          <Link href={`/players/${p.id}`} className="underline decoration-2 underline-offset-4 hover:text-[#0b1730]">
                            View
                          </Link>
                          <span className="text-white/40">•</span>
                          <Link
                            href={`/players/${p.id}/assign`}
                            className="underline decoration-2 underline-offset-4 hover:text-[#0b1730]"
                          >
                            Assign
                          </Link>
                          <span className="text-white/40">•</span>
                          <Link href={`/players/${p.id}/edit`} className="underline decoration-2 underline-offset-4 hover:text-[#0b1730]">
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ) : (
          <EmptyState
            icon="⚽"
            title="No players match your search"
            description={q ? 'Try a different name, nickname, or jersey number.' : 'Add new players to start building your squads.'}
            action={!q ? <Link href="/players/new" className={primaryActionButton}>Add your first player</Link> : undefined}
          />
        )}

        {msg && (
          <div className={cx(brandCard, 'border border-[#F289AE]/40 bg-[#F289AE]/20 p-4 text-sm text-[#742348]')}>{msg}</div>
        )}
      </div>
    </main>
  );
}
