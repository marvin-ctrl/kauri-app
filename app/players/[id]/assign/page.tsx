'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Team = { id: string; name: string };

export default function AssignPlayerToTeamsPage() {
  const router = useRouter();
  const { id: playerId } = useParams<{ id: string }>();

  const [teams, setTeams] = useState<Team[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [role, setRole] = useState<'player' | 'captain'>('player');
  const [joinedAt, setJoinedAt] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('teams').select('id,name').order('name');
      setTeams(data || []);
    })();
  }, []);

  function toggle(teamId: string) {
    const next = new Set(selected);
    if (next.has(teamId)) next.delete(teamId);
    else next.add(teamId);
    setSelected(next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (selected.size === 0) { setMsg('Select at least one team.'); return; }

    setSaving(true);
    try {
      const termId = typeof window !== 'undefined' ? localStorage.getItem('kauri.termId') : null;
      if (!termId) { setMsg('Select a term in the header.'); setSaving(false); return; }

      // 1) ensure player_terms row
      const pt = await supabase
        .from('player_terms')
        .select('id')
        .eq('player_id', String(playerId))
        .eq('term_id', termId)
        .maybeSingle();

      let playerTermId = pt.data?.id as string | undefined;
      if (!playerTermId) {
        const ins = await supabase
          .from('player_terms')
          .insert({ player_id: String(playerId), term_id: termId, status: 'registered' })
          .select('id')
          .single();
        if (ins.error || !ins.data) throw ins.error || new Error('Failed to create player_terms');
        playerTermId = ins.data.id;
      }

      // 2) ensure team_terms rows for each selected team
      const teamIds = Array.from(selected);
      const teamTermIds: string[] = [];
      for (const team_id of teamIds) {
        const tt = await supabase
          .from('team_terms')
          .select('id')
          .eq('team_id', team_id)
          .eq('term_id', termId)
          .maybeSingle();
        if (tt.data?.id) {
          teamTermIds.push(tt.data.id);
        } else {
          const ins = await supabase
            .from('team_terms')
            .insert({ team_id, term_id: termId })
            .select('id')
            .single();
          if (ins.error || !ins.data) throw ins.error || new Error('Failed to create team_terms');
          teamTermIds.push(ins.data.id);
        }
      }

      // 3) insert memberships if missing
      const existing = await supabase
        .from('memberships')
        .select('team_term_id')
        .eq('player_term_id', playerTermId);

      const existingSet = new Set((existing.data || []).map(r => r.team_term_id));
      const rows = teamTermIds
        .filter(ttid => !existingSet.has(ttid))
        .map(ttid => ({
          player_term_id: playerTermId!,
          team_term_id: ttid,
          role,
        }));

      if (rows.length) {
        const { error } = await supabase.from('memberships').insert(rows);
        if (error) throw error;
      }

      // 4) optional: set joined date on player_terms
      if (joinedAt) {
        await supabase
          .from('player_terms')
          .update({ registered_at: joinedAt })
          .eq('id', playerTermId);
      }

      setSaving(false);
      router.replace(`/players/${playerId}`);
    } catch (err: any) {
      setSaving(false);
      setMsg(`Error: ${err?.message || 'Failed to assign'}`);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <div className="max-w-2xl mx-auto bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Assign to teams</h1>
          <a
            href={`/players/${playerId}`}
            className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold"
          >
            Cancel
          </a>
        </header>

        <form onSubmit={onSubmit} className="space-y-5">
          <fieldset className="border border-neutral-200 rounded-lg p-4">
            <legend className="text-sm font-bold px-1">Teams</legend>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {teams.map(t => {
                const checked = selected.has(t.id);
                return (
                  <li key={t.id}>
                    <label className="flex items-center gap-2 p-2 border border-neutral-200 rounded-md hover:bg-neutral-50">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(t.id)}
                      />
                      <span className="text-sm">{t.name}</span>
                    </label>
                  </li>
                );
              })}
              {teams.length === 0 && <li className="text-sm text-neutral-800">No teams yet.</li>}
            </ul>
          </fieldset>

          <fieldset className="border border-neutral-200 rounded-lg p-4">
            <legend className="text-sm font-bold px-1">Role</legend>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="player"
                  checked={role === 'player'}
                  onChange={() => setRole('player')}
                />
                <span className="text-sm">Player</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="captain"
                  checked={role === 'captain'}
                  onChange={() => setRole('captain')}
                />
                <span className="text-sm">Captain</span>
              </label>
            </div>
          </fieldset>

          <label className="block text-sm font-medium">
            Registered date (optional)
            <input
              type="date"
              value={joinedAt}
              onChange={e => setJoinedAt(e.target.value)}
              className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-md px-3 py-2 font-semibold disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Assign to selected teams'}
          </button>

          {msg && <div className={`text-sm ${msg.startsWith('Error') ? 'text-red-800' : 'text-green-800'}`}>{msg}</div>}
        </form>
      </div>
    </main>
  );
}
