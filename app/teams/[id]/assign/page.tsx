'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PlayerRow = {
  player_term_id: string | null;
  player_id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  jersey_no: number | null;
  status: 'registered';
};

export default function AssignPlayersToTeamPage() {
  const { id: teamId } = useParams<{ id: string }>();
  const router = useRouter();

  const [teamName, setTeamName] = useState<string>('');
  const [teamTermId, setTeamTermId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set()); // set of player_term_id
  const [q, setQ] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // quick-add form
  const [showAdd, setShowAdd] = useState(false);
  const [fn, setFn] = useState('');
  const [ln, setLn] = useState('');
  const [pn, setPn] = useState('');
  const [dob, setDob] = useState('');
  const [jn, setJn] = useState<string>('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    (async () => {
      setMsg(null);
      const termId = localStorage.getItem('kauri.termId');
      if (!termId) { setMsg('Select a term in the header.'); return; }

      // team label
      const t = await supabase.from('teams').select('name').eq('id', teamId).maybeSingle();
      setTeamName(t.data?.name || 'Team');

      // ensure team_terms exists
      const tt = await supabase
        .from('team_terms')
        .select('id')
        .eq('team_id', String(teamId))
        .eq('term_id', termId)
        .maybeSingle();

      let ttId = tt.data?.id as string | undefined;
      if (!ttId) {
        const ins = await supabase
          .from('team_terms')
          .insert({ team_id: String(teamId), term_id: termId })
          .select('id')
          .single();
        if (ins.error || !ins.data) { setMsg(ins.error?.message || 'Failed to create team shell'); return; }
        ttId = ins.data.id;
      }
      setTeamTermId(ttId!);

      // load all players
      const all = await supabase
        .from('players')
        .select('id, first_name, last_name, preferred_name, jersey_no')
        .order('first_name');

      const allPlayers = all.data || [];

      // load player_terms for term
      const existingPT = await supabase
        .from('player_terms')
        .select('id, player_id')
        .eq('term_id', termId);

      const havePT = new Map<string, string>(); // player_id -> player_term_id
      (existingPT.data || []).forEach(r => havePT.set(r.player_id as string, r.id as string));

      // auto-register missing players to this term
      const missing = allPlayers.filter(p => !havePT.has(p.id));
      while (missing.length) {
        const batch = missing.splice(0, 200).map(p => ({
          player_id: p.id, term_id: termId, status: 'registered'
        }));
        if (batch.length) {
          const ins = await supabase.from('player_terms').insert(batch).select('id, player_id');
          if (ins.error) { setMsg(`Error registering players: ${ins.error.message}`); return; }
          (ins.data || []).forEach((r: any) => havePT.set(r.player_id, r.id));
        }
      }

      // build list
      const list: PlayerRow[] = allPlayers.map((p: any) => ({
        player_term_id: havePT.get(p.id) || null,
        player_id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        preferred_name: p.preferred_name,
        jersey_no: p.jersey_no,
        status: 'registered'
      }));
      setPlayers(list);

      // pre-select existing memberships
      const cur = await supabase
        .from('memberships')
        .select('player_term_id')
        .eq('team_term_id', ttId!);
      const pre = new Set((cur.data || []).map(r => r.player_term_id as string));
      setSelected(pre);
    })();
  }, [teamId]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return players.filter(p => {
      if (!t) return true;
      const name = `${p.first_name} ${p.last_name} ${p.preferred_name || ''}`.toLowerCase();
      return name.includes(t) || String(p.jersey_no ?? '').includes(t);
    });
  }, [players, q]);

  function toggle(ptid: string) {
    const next = new Set(selected);
    if (next.has(ptid)) next.delete(ptid); else next.add(ptid);
    setSelected(next);
  }

  function toggleAll(ids: string[], on: boolean) {
    const next = new Set(selected);
    ids.forEach(id => on ? next.add(id) : next.delete(id));
    setSelected(next);
  }

  async function save() {
    setMsg(null);
    const termId = localStorage.getItem('kauri.termId');
    if (!termId) { setMsg('Select a term in the header.'); return; }
    if (!teamTermId) { setMsg('Missing team-term. Reload.'); return; }

    setSaving(true);
    try {
      // current memberships for this team-term
      const cur = await supabase
        .from('memberships')
        .select('player_term_id')
        .eq('team_term_id', teamTermId);
      const current = new Set((cur.data || []).map(r => r.player_term_id as string));

      // add = selected - current
      const toAdd = Array.from(selected)
        .filter(id => !current.has(id))
        .map(id => ({ player_term_id: id, team_term_id: teamTermId, role: 'player' }));

      // remove = current - selected
      const toRemove = Array.from(current)
        .filter(id => !selected.has(id));

      if (toAdd.length) {
        const { error } = await supabase.from('memberships').insert(toAdd);
        if (error) throw error;
      }
      if (toRemove.length) {
        const { error } = await supabase.from('memberships')
          .delete().in('player_term_id', toRemove).eq('team_term_id', teamTermId);
        if (error) throw error;
      }

      setSaving(false);
      router.replace(`/teams/${teamId}/roster`);
    } catch (e: any) {
      setSaving(false);
      setMsg(`Error: ${e?.message || 'Failed to save'}`);
    }
  }

  async function addPlayerQuick(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const termId = localStorage.getItem('kauri.termId');
    if (!termId) { setMsg('Select a term in the header.'); return; }
    const first = fn.trim();
    const last = ln.trim();
    if (!first || !last) { setMsg('First and last name are required.'); return; }

    setAdding(true);
    try {
      // 1) create player
      const payload: any = {
        first_name: first,
        last_name: last,
        preferred_name: pn.trim() || null,
        jersey_no: jn ? Number(jn) : null,
        dob: dob || null
      };
      const p = await supabase.from('players').insert(payload).select('id, first_name, last_name, preferred_name, jersey_no').single();
      if (p.error || !p.data) throw p.error || new Error('Create player failed');

      // 2) ensure player_terms for current term
      const pt = await supabase
        .from('player_terms')
        .insert({ player_id: p.data.id, term_id: termId, status: 'registered' })
        .select('id')
        .single();
      if (pt.error || !pt.data) throw pt.error || new Error('Register player failed');

      // 3) update UI list and select
      const row: PlayerRow = {
        player_term_id: pt.data.id,
        player_id: p.data.id,
        first_name: p.data.first_name,
        last_name: p.data.last_name,
        preferred_name: p.data.preferred_name,
        jersey_no: p.data.jersey_no,
        status: 'registered'
      };
      setPlayers(prev => [row, ...prev]);
      setSelected(prev => {
        const next = new Set(prev);
        next.add(pt.data.id);
        return next;
      });

      // 4) reset form
      setFn(''); setLn(''); setPn(''); setDob(''); setJn(''); setShowAdd(false);
      setAdding(false);
    } catch (err: any) {
      setAdding(false);
      setMsg(`Error: ${err?.message || 'Failed to add player'}`);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <div className="max-w-4xl mx-auto bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Assign players</h1>
            <p className="text-sm text-neutral-700">{teamName}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={`/teams/${teamId}/roster`} className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold">Cancel</a>
            <button onClick={save} disabled={saving || !teamTermId}
              className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold disabled:opacity-60">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </header>

        {/* Quick add player */}
        <section className="border border-neutral-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Quick add player</h2>
            <button
              onClick={() => setShowAdd(s => !s)}
              className="text-sm underline text-blue-700"
              type="button"
            >
              {showAdd ? 'Hide' : 'Show'}
            </button>
          </div>
          {showAdd && (
            <form onSubmit={addPlayerQuick} className="mt-3 grid grid-cols-1 md:grid-cols-6 gap-3">
              <input
                required
                placeholder="First name"
                value={fn}
                onChange={e=>setFn(e.target.value)}
                className="border border-neutral-300 rounded-md px-3 py-2 bg-white md:col-span-2"
              />
              <input
                required
                placeholder="Last name"
                value={ln}
                onChange={e=>setLn(e.target.value)}
                className="border border-neutral-300 rounded-md px-3 py-2 bg-white md:col-span-2"
              />
              <input
                placeholder="Preferred name"
                value={pn}
                onChange={e=>setPn(e.target.value)}
                className="border border-neutral-300 rounded-md px-3 py-2 bg-white md:col-span-2"
              />
              <input
                type="date"
                value={dob}
                onChange={e=>setDob(e.target.value)}
                className="border border-neutral-300 rounded-md px-3 py-2 bg-white md:col-span-2"
                placeholder="DoB"
              />
              <input
                type="number"
                min={0}
                placeholder="Jersey #"
                value={jn}
                onChange={e=>setJn(e.target.value)}
                className="border border-neutral-300 rounded-md px-3 py-2 bg-white md:col-span-2"
              />
              <button
                type="submit"
                disabled={adding}
                className="md:col-span-2 px-3 py-2 rounded-md bg-neutral-900 hover:bg-black text-white font-semibold disabled:opacity-60"
              >
                {adding ? 'Adding…' : 'Add player'}
              </button>
            </form>
          )}
        </section>

        {/* Search + bulk select */}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            placeholder="Search by name or jersey…"
            value={q}
            onChange={e=>setQ(e.target.value)}
            className="border border-neutral-300 rounded-md px-3 py-2 bg-white"
          />
          <button onClick={() => toggleAll(filtered.map(p=>p.player_term_id!).filter(Boolean), true)}
            className="px-2 py-1 text-sm rounded bg-neutral-800 text-white">Select all (filtered)</button>
          <button onClick={() => toggleAll(filtered.map(p=>p.player_term_id!).filter(Boolean), false)}
            className="px-2 py-1 text-sm rounded bg-neutral-200">Clear all (filtered)</button>
        </div>

        {/* Table */}
        <section className="border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 border-b border-neutral-200">
              <tr>
                <th className="p-2 text-left">Add</th>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Jersey</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const name = p.preferred_name || `${p.first_name} ${p.last_name}`;
                const ptid = p.player_term_id!;
                const checked = selected.has(ptid);
                return (
                  <tr key={ptid} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="p-2">
                      <input type="checkbox" checked={checked} onChange={()=>toggle(ptid)} />
                    </td>
                    <td className="p-2">{name}</td>
                    <td className="p-2">{p.jersey_no ?? '—'}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td className="p-4 text-neutral-700" colSpan={3}>No players.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        {msg && <p className="text-sm text-red-800">{msg}</p>}
      </div>
    </main>
  );
}
