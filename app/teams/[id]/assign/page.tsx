'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Team = { id: string; name: string };
type Player = { id: string; first_name: string; last_name: string; preferred_name: string | null };

export default function AssignPlayersToTeamPage() {
  const router = useRouter();
  const { id: teamId } = useParams<{ id: string }>();

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [role, setRole] = useState<'player' | 'captain'>('player');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Load team info
      const { data: teamData } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', teamId)
        .maybeSingle();
      setTeam(teamData || null);

      // Load all players
      const { data: playersData } = await supabase
        .from('players')
        .select('id, first_name, last_name, preferred_name')
        .order('first_name');
      setPlayers(playersData || []);
    })();
  }, [teamId]);

  function toggle(playerId: string) {
    const next = new Set(selected);
    next.has(playerId) ? next.delete(playerId) : next.add(playerId);
    setSelected(next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (selected.size === 0) {
      setMsg('Select at least one player.');
      return;
    }

    setSaving(true);
    try {
      const termId = localStorage.getItem('kauri.termId');
      if (!termId) {
        setMsg('Select a term in the header.');
        setSaving(false);
        return;
      }

      // Ensure team_terms row exists for this team
      const tt = await supabase
        .from('team_terms')
        .select('id')
        .eq('team_id', teamId)
        .eq('term_id', termId)
        .maybeSingle();

      let teamTermId: string;
      if (tt.data?.id) {
        teamTermId = tt.data.id;
      } else {
        const ins = await supabase
          .from('team_terms')
          .insert({ team_id: teamId, term_id: termId })
          .select('id')
          .single();
        if (ins.error || !ins.data) {
          throw new Error(ins.error?.message || 'Failed to create team_terms');
        }
        teamTermId = ins.data.id;
      }

      // For each selected player, ensure player_terms exists and create membership
      const playerIds = Array.from(selected);
      
      for (const playerId of playerIds) {
        // Ensure player_terms row
        const pt = await supabase
          .from('player_terms')
          .select('id')
          .eq('player_id', playerId)
          .eq('term_id', termId)
          .maybeSingle();

        let playerTermId: string;
        if (pt.data?.id) {
          playerTermId = pt.data.id;
        } else {
          const ins = await supabase
            .from('player_terms')
            .insert({ player_id: playerId, term_id: termId, status: 'registered' })
            .select('id')
            .single();
          if (ins.error || !ins.data) {
            throw new Error(ins.error?.message || 'Failed to create player_terms');
          }
          playerTermId = ins.data.id;
        }

        // Create membership (use upsert to avoid duplicates)
        const { error: memberError } = await supabase
          .from('memberships')
          .upsert(
            {
              player_term_id: playerTermId,
              team_term_id: teamTermId,
              role: role
            },
            { onConflict: 'player_term_id,team_term_id' }
          );

        if (memberError) {
          throw new Error(memberError.message);
        }
      }

      setSaving(false);
      router.replace(`/teams/${teamId}/roster`);
    } catch (err: any) {
      setSaving(false);
      setMsg(`Error: ${err?.message || 'Failed to assign'}`);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <div className="max-w-2xl mx-auto bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Assign players</h1>
            <p className="text-sm text-neutral-700">{team?.name || 'Team'}</p>
          </div>
          <a
            href={`/teams/${teamId}/roster`}
            className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold"
          >
            Cancel
          </a>
        </header>

        <form onSubmit={onSubmit} className="space-y-5">
          <fieldset className="border border-neutral-200 rounded-lg p-4">
            <legend className="text-sm font-bold px-1">Players</legend>
            <div className="max-h-96 overflow-y-auto">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {players.map(p => {
                  const checked = selected.has(p.id);
                  const name = p.preferred_name || `${p.first_name} ${p.last_name}`;
                  return (
                    <li key={p.id}>
                      <label className="flex items-center gap-2 p-2 border border-neutral-200 rounded-md hover:bg-neutral-50 text-black cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(p.id)}
                        />
                        <span className="text-sm">{name}</span>
                      </label>
                    </li>
                  );
                })}
                {players.length === 0 && (
                  <li className="text-sm text-neutral-700">No players yet.</li>
                )}
              </ul>
            </div>
          </fieldset>

          <fieldset className="border border-neutral-200 rounded-lg p-4">
            <legend className="text-sm font-bold px-1">Role</legend>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="player"
                  checked={role === 'player'}
                  onChange={() => setRole('player')}
                />
                <span className="text-sm">Player</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
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

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-md px-3 py-2 font-semibold disabled:opacity-60"
          >
            {saving ? 'Saving…' : `Add ${selected.size} player${selected.size !== 1 ? 's' : ''} to team`}
          </button>

          {msg && (
            <div className={`text-sm ${msg.startsWith('Error') ? 'text-red-800' : 'text-green-800'}`}>
              {msg}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
