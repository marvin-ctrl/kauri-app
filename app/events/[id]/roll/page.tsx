'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
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
  secondaryActionButton,
  subtleText
} from '@/lib/theme';

export const dynamic = 'force-dynamic';

// Assumptions:
// - events has columns: id, team_term_id (uuid|null), title, type, starts_at
// - memberships links team_term_id -> player_term_id for current term
// - player_terms links -> players
type PlayerRow = {
  player_term_id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  jersey_no: number | null;
  // current status in attendance for this event (if any)
  status: 'present' | 'absent' | 'late' | null;
  notes: string | null;
};

export default function EventRollPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { id: eventId } = useParams<{ id: string }>();

  const [eventTitle, setEventTitle] = useState<string>('Event');
  const [whenStr, setWhenStr] = useState<string>('');
  const [rows, setRows] = useState<PlayerRow[]>([]);
  const [q, setQ] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string|null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: ev } = await supabase
        .from('events')
        .select('team_id,title,type,starts_at')
        .eq('id', eventId)
        .single();
      if (!ev) { setLoading(false); return; }

      const titlePart = ev.title || ev.type || 'Event';
      setEventTitle(titlePart);

      const whenPart = ev.starts_at
        ? new Date(ev.starts_at).toLocaleString('en-NZ', {
            weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'
          })
        : '';
      setWhenStr(whenPart);

      // If no team, stop
      if (!ev.team_id) {
        setLoading(false);
        return;
      }

      // Find all team_terms for this team
      const { data: teamTerms } = await supabase
        .from('team_terms')
        .select('id')
        .eq('team_id', ev.team_id);
      if (!teamTerms?.length) {
        setLoading(false);
        return;
      }
      const teamTermIds = teamTerms.map(t => t.id);

      // Get memberships -> player_term_id
      const { data: memberships } = await supabase
        .from('memberships')
        .select('player_term_id')
        .in('team_term_id', teamTermIds);
      if (!memberships?.length) {
        setLoading(false);
        return;
      }
      const playerTermIds = memberships.map(m => m.player_term_id);

      // Get player_terms + players
      const { data: playerTermData } = await supabase
        .from('player_terms')
        .select(`
          id,
          jersey_no,
          player:player_id (
            first_name,
            last_name,
            preferred_name
          )
        `)
        .in('id', playerTermIds);
      if (!playerTermData) {
        setLoading(false);
        return;
      }

      // Fetch existing attendance for this event
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('player_term_id, status, notes')
        .eq('event_id', eventId);
      const attMap = new Map<string, { status: string; notes: string|null }>();
      if (attendanceData) {
        attendanceData.forEach(a => {
          attMap.set(a.player_term_id, { status: a.status, notes: a.notes });
        });
      }

      const built: PlayerRow[] = [];
      for (const pt of playerTermData) {
        const p = pt.player as any;
        const att = attMap.get(pt.id);
        built.push({
          player_term_id: pt.id,
          first_name: p.first_name,
          last_name: p.last_name,
          preferred_name: p.preferred_name,
          jersey_no: pt.jersey_no,
          status: att?.status as any || null,
          notes: att?.notes || null
        });
      }
      setRows(built);
      setLoading(false);
    })();
  }, [eventId]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const lower = q.toLowerCase();
    return rows.filter(r => {
      const fullName = `${r.first_name} ${r.last_name}`.toLowerCase();
      const pref = r.preferred_name?.toLowerCase() ?? '';
      const jersey = String(r.jersey_no ?? '');
      return fullName.includes(lower) || pref.includes(lower) || jersey.includes(lower);
    });
  }, [rows, q]);

  function setStatus(ptId: string, status: 'present'|'absent'|'late'|null) {
    setRows(prev => prev.map(r =>
      r.player_term_id === ptId ? { ...r, status } : r
    ));
  }
  function setNote(ptId: string, notes: string) {
    setRows(prev => prev.map(r =>
      r.player_term_id === ptId ? { ...r, notes: notes||null } : r
    ));
  }

  async function save() {
    try {
      setSaving(true);
      setMsg(null);

      // Only upsert rows with a status
      const rowsToUpsert = rows
        .filter(r => r.status !== null)
        .map(r => ({
          event_id: String(eventId),
          player_term_id: r.player_term_id,
          status: r.status!,
          notes: r.notes ?? null
        }));

      if (rowsToUpsert.length) {
        const { error } = await supabase
          .from('attendance')
          .upsert(rowsToUpsert, { onConflict: 'event_id,player_term_id' });
        if (error) throw error;
      }
      setSaving(false);
      setMsg('Saved.');
    } catch (e: any) {
      setSaving(false);
      setMsg(`Error: ${e?.message || 'Save failed'}`);
    }
  }

  function bulk(status: 'present'|'absent'|'late'|null) {
    setRows(prev => prev.map(r => ({ ...r, status })));
  }

  if (loading) {
    return (
      <main className={brandPage}>
        <LoadingState message="Loading roll…" />
      </main>
    );
  }

  return (
    <main className={brandPage}>
      <div className={brandContainer}>
        <div className={cx(brandCard, 'space-y-6 p-6 sm:p-8')}>
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className={cx(brandHeading, 'text-3xl sm:text-4xl')}>Take roll</h1>
              <p className={cx('text-sm', subtleText)}>
                {eventTitle} • {whenStr}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="/events" className={secondaryActionButton}>
                Back to events
              </a>
              <button onClick={save} disabled={saving} className={cx(primaryActionButton, 'disabled:opacity-60')}>
                {saving ? 'Saving…' : 'Save attendance'}
              </button>
            </div>
          </header>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search by name or jersey…"
                className="w-full rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm text-[#172F56] placeholder:text-[#415572]/70 shadow-inner focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/50"
              />
              <div className="flex flex-wrap gap-2">
                <BulkButton label="All present" onClick={() => bulk('present')} />
                <BulkButton label="All late" onClick={() => bulk('late')} />
                <BulkButton label="All absent" onClick={() => bulk('absent')} />
                <BulkButton label="Clear" onClick={() => bulk(null)} />
              </div>
            </div>

            {filtered.length > 0 ? (
              <section className={cx(brandTableCard, 'overflow-hidden')}>
                <table className="w-full text-sm">
                  <thead className="border-b border-white/40 bg-white/40 text-[#0f1f3b]">
                    <tr>
                      <th className="text-left px-4 py-3">Name</th>
                      <th className="text-left px-4 py-3">Jersey</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => {
                      const name = r.preferred_name || `${r.first_name} ${r.last_name}`;
                      return (
                        <tr key={r.player_term_id} className="border-b border-white/20 bg-white/60 text-[#0f1f3b] last:border-0">
                          <td className="px-4 py-3 font-semibold text-[#172F56]">{name}</td>
                          <td className="px-4 py-3">{r.jersey_no ?? '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <StatusButton
                                active={r.status === 'present'}
                                tone="present"
                                onClick={() => setStatus(r.player_term_id, 'present')}
                              >
                                Present
                              </StatusButton>
                              <StatusButton
                                active={r.status === 'late'}
                                tone="late"
                                onClick={() => setStatus(r.player_term_id, 'late')}
                              >
                                Late
                              </StatusButton>
                              <StatusButton
                                active={r.status === 'absent'}
                                tone="absent"
                                onClick={() => setStatus(r.player_term_id, 'absent')}
                              >
                                Absent
                              </StatusButton>
                              <StatusButton
                                active={r.status === null}
                                tone="clear"
                                onClick={() => setStatus(r.player_term_id, null)}
                              >
                                Clear
                              </StatusButton>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              value={r.notes ?? ''}
                              onChange={e => setNote(r.player_term_id, e.target.value)}
                              placeholder="Optional"
                              className="w-full rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm text-[#172F56] shadow-inner focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/50"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            ) : (
              <EmptyState
                icon="📋"
                title={q ? 'No players match your search' : 'No players linked to this event yet'}
                description={
                  q
                    ? 'Try searching by a different name or jersey number.'
                    : 'Assign a team or add player registrations to take attendance.'
                }
              />
            )}
          </div>

          {msg && (
            <div
              className={cx(
                'rounded-2xl border px-4 py-3 text-sm',
                msg.startsWith('Error')
                  ? 'border-[#F289AE]/40 bg-[#F289AE]/25 text-[#742348]'
                  : 'border-[#79CBC4]/40 bg-[#79CBC4]/20 text-[#0f3a37]'
              )}
            >
              {msg}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatusButton({
  active,
  tone,
  onClick,
  children
}: {
  active: boolean;
  tone: 'present' | 'late' | 'absent' | 'clear';
  onClick: () => void;
  children: ReactNode;
}) {
  const palette: Record<typeof tone, string> = {
    present: 'bg-[#79CBC4] text-[#0f223f] shadow-[0_12px_30px_-18px_rgba(15,34,63,0.45)]',
    late: 'bg-[#FACC15] text-[#172F56] shadow-[0_12px_30px_-18px_rgba(250,204,21,0.55)]',
    absent: 'bg-[#F289AE] text-[#172F56] shadow-[0_12px_30px_-18px_rgba(242,137,174,0.6)]',
    clear: 'bg-white text-[#172F56] shadow-[0_12px_30px_-18px_rgba(23,47,86,0.25)]'
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#79CBC4] focus-visible:ring-offset-2 focus-visible:ring-offset-white',
        active ? palette[tone] : 'border border-white/40 bg-white/20 text-[#172F56] hover:bg-white/40'
      )}
    >
      {children}
    </button>
  );
}

function BulkButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-white/50 bg-white/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-[#172F56] transition hover:-translate-y-0.5 hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#79CBC4] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
    >
      {label}
    </button>
  );
}
