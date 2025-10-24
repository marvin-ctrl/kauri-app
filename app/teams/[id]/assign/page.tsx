'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PlayerRow = {
  player_term_id: string;
  player_id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  jersey_no: number | null;
  status: string | null;
};

export default function AssignPlayersToTeamPage() {
  const { id: teamId } = useParams<{ id: string }>();
  const router = useRouter();

  const [teamName, setTeamName] = useState<string>('');
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [teamTermId, setTeamTermId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const termId = localStorage.getItem('kauri.termId');
      if (!termId) { setMsg('Select a term in the header.'); return; }

      const t = await supabase.from('teams').select('name').eq('id', teamId).maybeSingle();
      setTeamName(t.data?.name || 'Team');

      // ensure team_terms row
      const tt = await supabase
        .from('team_terms')
        .select('id')
        .eq('team_id', String(teamId))
        .eq('term_id', termId)
        .maybeSingle();

      if (tt.data?.id) setTeamTermId(tt.data.id);
      else {
        const ins = await supabase
          .from('team_terms')
          .insert({ team_id: String(teamId), term_id: termId })
          .select('id')
          .single();
        if (ins.error || !ins.data) { setMsg(ins.error?.message || 'Failed to create team-term'); return; }
        setTeamTermId(ins.data.id);
      }

      // players registered this term
      const res = await supabase
        .from('player_terms')
        .select('id, status, players(id, first_name, last_name, preferred_name, jersey_no)')
        .eq('term_id', termId)
        .order('status', { ascending: true });

      const list = (res.data || [])
        .map((r: any) => ({
          player_term_id: r.id,
          player_id: r.players?.id,
          first_name: r.players?.first_name,
          last_name: r.players?.last_name,
          preferred_name: r.players?.preferred_name,
          jersey_no: r.players?.jersey_no,
          status: r.status
        }))
        .filter((p: PlayerRow) => !!p.player_id);

      setPlayers(list);

      // preselect existing memberships
      const cur = await supabase
        .from('memberships')
        .select('player_term_id')
        .eq('team_term_id', (tt.data?.id ?? null) || (ins as any)?.data?.id || '');
      const pre = new Set((cur.data || []).map(r => r.player_term_id));
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
    if (!teamTermId) { setMsg('Missing team-term. Reload.'); return; }
    setSaving(true);
    try {
      const cur = await supabase
        .from('memberships')
        .select('player_term_id')
        .eq('team_term_id', teamTermId);
      const current = new Set((cur.data || []).map(r => r.player_term_id));

      const toAdd = Array.from(selected)
        .filter(id => !current.has(id))
        .map(id => ({ player_term_id: id, team_term_id: teamTermId, role: 'player' }));

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

        <div className="flex flex-wrap gap-3 items-center">
          <input
            placeholder="Search by name or jersey…"
            value={q}
            onChange={e=>setQ(e.target.value)}
            className="border border-neutral-300 rounded-md px-3 py-2 bg-white"
          />
          <button onClick={() => toggleAll(filtered.map(p=>p.player_term_id), true)}
            className="px-2 py-1 text-sm rounded bg-neutral-200 hover:bg-neutral-300">Select all (filtered)</button>
          <button onClick={() => toggleAll(filtered.map(p=>p.player_term_id), false)}
            className="px-2 py-1 text-sm rounded bg-neutral-200 hover:bg-neutral-300">Clear all (filtered)</button>
        </div>

        <section className="border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 border-b border-neutral-200">
              <tr>
                <th className="p-2 text-left">Add</th>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Jersey</th>
                <th className="p-2 text-left">Reg. status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const name = p.preferred_name || `${p.first_name} ${p.last_name}`;
                const checked = selected.has(p.player_term_id);
                return (
                  <tr key={p.player_term_id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="p-2">
                      <input type="checkbox" checked={checked} onChange={()=>toggle(p.player_term_id)} />
                    </td>
                    <td className="p-2">{name}</td>
                    <td className="p-2">{p.jersey_no ?? '—'}</td>
                    <td className="p-2">{p.status}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td className="p-4 text-neutral-700" colSpan={4}>No registered players for this term.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        {msg && <p className="text-sm text-red-800">{msg}</p>}
      </div>
    </main>
  );
}
