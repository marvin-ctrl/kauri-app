// app/teams/page.tsx
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

type TeamRow = {
  id: string;            // teams.id
  name: string;          // teams.name
  teamTermId?: string;   // team_terms.id for current term
  fee_amount?: number | null;
  fee_due_date?: string | null;
};

export default function TeamsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [rows, setRows] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);

    // Get current term by year/term (since start_date is null in your schema)
    const { data: term, error: termErr } = await supabase
      .from('terms')
      .select('id, year, term')
      .order('year', { ascending: false })
      .order('term', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (termErr) {
      setMsg(`Error loading term: ${termErr.message}`);
      setRows([]);
      setLoading(false);
      return;
    }
    const currentTermId = term?.id;

    // Load teams
    const { data: teams, error: teamsErr } = await supabase
      .from('teams')
      .select('id, name')
      .order('name', { ascending: true });

    if (teamsErr) {
      setMsg(teamsErr.message);
      setRows([]);
      setLoading(false);
      return;
    }

    // Load team_terms for the current term, mapped by team_id
    let ttByTeamId = new Map<string, { id: string; fee_amount: number | null; fee_due_date: string | null }>();
    if (currentTermId && teams && teams.length) {
      const teamIds = teams.map(t => t.id);
      const { data: tterms, error: ttErr } = await supabase
        .from('team_terms')
        .select('id, team_id, fee_amount, fee_due_date')
        .eq('term_id', currentTermId)
        .in('team_id', teamIds);

      if (ttErr) {
        setMsg(`Error loading team terms: ${ttErr.message}`);
      } else if (tterms) {
        ttByTeamId = new Map(
          tterms.map(tt => [
            String(tt.team_id),
            {
              id: String(tt.id),
              fee_amount: (tt.fee_amount as number | null) ?? null,
              fee_due_date: (tt.fee_due_date as string | null) ?? null
            }
          ])
        );
      }
    }

    // Merge for render
    const merged: TeamRow[] = (teams || []).map(t => {
      const tt = ttByTeamId.get(t.id);
      return {
        id: t.id,
        name: t.name,
        teamTermId: tt?.id,
        fee_amount: tt?.fee_amount ?? null,
        fee_due_date: tt?.fee_due_date ?? null
      };
    });

    setRows(merged);
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

  if (loading) {
    return (
      <main className={brandPage}>
        <LoadingState message="Loading teams…" />
      </main>
    );
  }

  return (
    <main className={brandPage}>
      <div className={brandContainer}>
        <header className={cx(brandCard, 'flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between')}>
          <div className="space-y-1">
            <h1 className={cx(brandHeading, 'text-3xl sm:text-4xl')}>Teams</h1>
            <p className={cx('text-sm', subtleText)}>Organise squads, assign coaches, track fees by term.</p>
          </div>
          <Link href="/teams/new" className={primaryActionButton}>
            New team
          </Link>
        </header>

        {rows.length > 0 ? (
          <section className={cx(brandTableCard, 'overflow-hidden')}>
            <table className="w-full text-sm">
              <thead className="border-b border-white/40 bg-white/40 text-[#0f1f3b]">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Fee</th>
                  <th className="text-left px-4 py-3">Due</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(t => (
                  <tr key={t.id} className="border-b border-white/20 bg-white/60 text-[#0f1f3b] last:border-0">
                    <td className="px-4 py-3 font-semibold text-[#172F56]">{t.name}</td>
                    <td className="px-4 py-3">
                      {t.fee_amount != null ? `$${Number(t.fee_amount).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3">{t.fee_due_date ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#172F56]">
                        <Link href={`/teams/${t.id}/roster`} className="underline decoration-2 underline-offset-4 hover:text-[#0b1730]">
                          Roster
                        </Link>
                        <span className="text-white/40">•</span>
                        <Link href={`/teams/${t.id}/assign`} className="underline decoration-2 underline-offset-4 hover:text-[#0b1730]">
                          Assign
                        </Link>
                        <span className="text-white/40">•</span>

                        {t.teamTermId ? (
                          <Link
                            href={`/teams/${t.teamTermId}/settings`}
                            className="underline decoration-2 underline-offset-4 hover:text-[#0b1730]">
                            Fee settings
                          </Link>
                        ) : (
                          <span className="opacity-70" title="No team-term for the active term yet">Fee settings (no term)</span>
                        )}

                        <span className="text-white/40">•</span>
                        <button
                          onClick={() => removeTeam(t.id)}
                          className="text-[#c41d5e] underline decoration-2 underline-offset-4 transition hover:text-[#9b1549]">
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
            icon="👥"
            title="No teams yet"
            description="Create a team to group players and build season rosters."
            action={<Link href="/teams/new" className={primaryActionButton}>Create a team</Link>}
          />
        )}

        {msg && (
          <div className={cx(brandCard, 'border border-[#F289AE]/40 bg-[#F289AE]/20 p-4 text-sm text-[#742348]')}>{msg}</div>
        )}
      </div>
    </main>
  );
}
