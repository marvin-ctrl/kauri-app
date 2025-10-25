'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const { id: eventId } = useParams<{ id: string }>();

  const [eventTitle, setEventTitle] = useState<string>('Event');
  const [whenStr, setWhenStr] = useState<string>('—');
  const [teamTermId, setTeamTermId] = useState<string | null>(null);

  const [rows, setRows] = useState<PlayerRow[]>([]);
  const [q, setQ] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg(null);

      // load event
      const ev = await supabase
        .from('events')
        .select('title, type, starts_at, team_term_id')
        .eq('id', String(eventId))
        .maybeSingle();
      if (ev.error || !ev.data) { setMsg(ev.error?.message || 'Event not found'); setLoading(false); return; }

      setEventTitle(ev.data.title || ev.data.type);
      setWhenStr(new Date(ev.data.starts_at).toLocaleString('en-NZ', {
        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }));
      setTeamTermId(ev.data.team_term_id ?? null);

      // Get base list of player_term_ids to take roll for.
      // If the event is team-specific, use memberships for that team_term_id.
      // Else, use all player_terms for the current term.
      const termId = localStorage.getItem('kauri.termId');
      if (!termId) { setMsg('Select a term in the header.'); setLoading(false); return; }

      let pts: { id: string, players: { first_name: string, last_name: string, preferred_name: string|null, jersey_no: number|null } }[] = [];

      if (ev.data.team_term_id) {
        // roster for this team
        const mem = await supabase
          .from('memberships')
          .select(`
            player_terms (
              id,
              players ( first_name, last_name, preferred_name, jersey_no )
            )
          `)
          .eq('team_term_id', ev.data.team_term_id);
        pts = (mem.data || []).map((m: any) => m.player_terms);
      } else {
        // all registered players in the term
        const all = await supabase
          .from('player_terms')
          .select('id, players ( first_name, last_name, preferred_name, jersey_no )')
          .eq('term_id', termId);
        pts = (all.data || []) as any;
      }

      // seed rows
      const base: PlayerRow[] = pts.map((pt: any) => ({
        player_term_id: pt.id,
        first_name: pt.players.first_name,
        last_name: pt.players.last_name,
        preferred_name: pt.players.preferred_name,
        jersey_no: pt.players.jersey_no,
        status: null,
        notes: null
      }));

      // load any existing attendance for this event
      const att = await supabase
        .from('attendance')
        .select('player_term_id, status, notes')
        .eq('event_id', String(eventId));

      const byPT = new Map<string, {status: any, notes: string|null}>();
      (att.data || []).forEach(r => byPT.set(r.player_term_id as string, { status: r.status, notes: r.notes ?? null }));

      // merge
      const merged = base.map(r => {
        const ex = byPT.get(r.player_term_id);
        return ex ? { ...r, status: ex.status as any, notes: ex.notes } : r;
      });

      setRows(merged);
      setLoading(false);
    })();
  }, [eventId]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows
      .slice()
      .sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''))
      .filter(r => {
        if (!t) return true;
        const name = `${r.first_name} ${r.last_name} ${r.preferred_name || ''}`.toLowerCase();
        return name.includes(t) || String(r.jersey_no ?? '').includes(t);
      });
  }, [rows, q]);

  const tally = useMemo(() => {
    const present = rows.filter(r => r.status === 'present').length;
    const late = rows.filter(r => r.status === 'late').length;
    const absent = rows.filter(r => r.status === 'absent').length;
    const unmarked = rows.filter(r => r.status === null).length;
    return { present, late, absent, unmarked, total: rows.length };
  }, [rows]);

  function setStatus(ptid: string, status: 'present'|'absent'|'late'|null) {
    setRows(prev => prev.map(r => r.player_term_id === ptid ? { ...r, status } : r));
  }

  function setNote(ptid: string, notes: string) {
    setRows(prev => prev.map(r => r.player_term_id === ptid ? { ...r, notes } : r));
  }

  async function save() {
    setMsg(null);
    setSaving(true);
    try {
      // build upserts for any row with a status
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

  if (loading) return <main className="min-h-screen grid place-items-center">Loading…</main>;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-black">Take roll</h1>
            <p className="text-sm text-black font-medium">{eventTitle} • {whenStr}</p>
          </div>
          <div className="flex gap-2">
            <a href="/events" className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-black font-semibold">Back</a>
            <button onClick={save} disabled={saving} className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </header>

        <div className="bg-white border-2 border-black rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-bold text-black mb-3">Attendance Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-green-100 border-2 border-green-700 rounded-lg p-3 text-center">
              <div className="text-3xl font-bold text-green-900">{tally.present}</div>
              <div className="text-sm font-semibold text-green-900 mt-1">Present</div>
            </div>
            <div className="bg-amber-100 border-2 border-amber-600 rounded-lg p-3 text-center">
              <div className="text-3xl font-bold text-amber-900">{tally.late}</div>
              <div className="text-sm font-semibold text-amber-900 mt-1">Late</div>
            </div>
            <div className="bg-red-100 border-2 border-red-700 rounded-lg p-3 text-center">
              <div className="text-3xl font-bold text-red-900">{tally.absent}</div>
              <div className="text-sm font-semibold text-red-900 mt-1">Absent</div>
            </div>
            <div className="bg-neutral-100 border-2 border-neutral-400 rounded-lg p-3 text-center">
              <div className="text-3xl font-bold text-black">{tally.unmarked}</div>
              <div className="text-sm font-semibold text-black mt-1">Unmarked</div>
            </div>
            <div className="bg-blue-100 border-2 border-blue-700 rounded-lg p-3 text-center">
              <div className="text-3xl font-bold text-blue-900">{tally.total}</div>
              <div className="text-sm font-semibold text-blue-900 mt-1">Total</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={e=>setQ(e.target.value)}
            placeholder="Search by name or jersey…"
            className="border-2 border-black rounded-md px-3 py-2 bg-white text-black font-medium flex-1 min-w-[200px]"
          />
          <button onClick={()=>bulk('present')} className="px-3 py-2 text-sm font-bold rounded bg-green-700 hover:bg-green-800 text-white border-2 border-black">All present</button>
          <button onClick={()=>bulk('absent')}  className="px-3 py-2 text-sm font-bold rounded bg-red-700 hover:bg-red-800 text-white border-2 border-black">All absent</button>
          <button onClick={()=>bulk(null)}      className="px-3 py-2 text-sm font-bold rounded bg-white hover:bg-neutral-100 text-black border-2 border-black">Clear all</button>
        </div>

        <section className="bg-white border-2 border-black rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="text-left p-3 font-bold">Name</th>
                <th className="text-left p-3 font-bold">Jersey</th>
                <th className="text-left p-3 font-bold">Status</th>
                <th className="text-left p-3 font-bold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const name = r.preferred_name || `${r.first_name} ${r.last_name}`;
                return (
                  <tr key={r.player_term_id} className="border-b-2 border-neutral-200 hover:bg-neutral-50">
                    <td className="p-3 font-semibold text-black">{name}</td>
                    <td className="p-3 font-semibold text-black">{r.jersey_no ?? '—'}</td>
                    <td className="p-3">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={()=>setStatus(r.player_term_id,'present')}
                          className={`px-3 py-2 rounded font-bold border-2 ${r.status==='present'?'bg-green-700 text-white border-black':'bg-white text-black border-neutral-300 hover:border-black'}`}
                        >Present</button>
                        <button
                          type="button"
                          onClick={()=>setStatus(r.player_term_id,'late')}
                          className={`px-3 py-2 rounded font-bold border-2 ${r.status==='late'?'bg-amber-600 text-white border-black':'bg-white text-black border-neutral-300 hover:border-black'}`}
                        >Late</button>
                        <button
                          type="button"
                          onClick={()=>setStatus(r.player_term_id,'absent')}
                          className={`px-3 py-2 rounded font-bold border-2 ${r.status==='absent'?'bg-red-700 text-white border-black':'bg-white text-black border-neutral-300 hover:border-black'}`}
                        >Absent</button>
                      </div>
                    </td>
                    <td className="p-3">
                      <input
                        value={r.notes ?? ''}
                        onChange={e=>setNote(r.player_term_id, e.target.value)}
                        placeholder="Optional"
                        className="w-full border-2 border-neutral-300 rounded-md px-2 py-1 bg-white text-black font-medium focus:border-black"
                      />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td className="p-4 text-black font-semibold" colSpan={4}>No players.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        {msg && <p className={`text-sm ${msg.startsWith('Error')?'text-red-800':'text-green-800'}`}>{msg}</p>}
      </div>
    </main>
  );
}
