'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/lib/supabase';
import { useAuthGuard } from '@/lib/auth-guard';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { isValidUUID } from '@/lib/validation';

type Team = { id: string; name: string };
type Player = { id: string; first_name: string; last_name: string; preferred_name: string | null };

export default function AssignPlayersToTeamPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuthGuard();
  const router = useRouter();
  const { id: teamId } = useParams<{ id: string }>();
  const supabase = useSupabase();

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [role, setRole] = useState<'player' | 'captain'>('player');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!isValidUUID(String(teamId))) {
      setMsg('Invalid team ID');
      return;
    }

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
  }, [teamId, supabase]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

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
      const termId = typeof window !== 'undefined'
        ? localStorage.getItem(LOCAL_STORAGE_KEYS.TERM_ID)
        : null;

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

      // FIXED: Batch queries to avoid N+1 problem
      const playerIds = Array.from(selected);

      // Single query to get all existing player_terms
      const { data: existingPTs } = await supabase
        .from('player_terms')
        .select('id, player_id')
        .in('player_id', playerIds)
        .eq('term_id', termId);

      const existingMap = new Map(existingPTs?.map(pt => [pt.player_id, pt.id]) || []);

      // Batch insert missing player_terms
      const missingPlayerIds = playerIds.filter(pid => !existingMap.has(pid));
      if (missingPlayerIds.length > 0) {
        const { data: newPTs, error: insertError } = await supabase
          .from('player_terms')
          .insert(missingPlayerIds.map(pid => ({
            player_id: pid,
            term_id: termId,
            status: 'registered'
          })))
          .select('id, player_id');

        if (insertError) {
          throw new Error(insertError.message || 'Failed to create player_terms');
        }

        newPTs?.forEach(pt => existingMap.set(pt.player_id, pt.id));
      }

      // Batch upsert memberships
      const memberships = playerIds.map(pid => ({
        player_term_id: existingMap.get(pid)!,
        team_term_id: teamTermId,
        role: role
      }));

      const { error: memberError } = await supabase
        .from('memberships')
        .upsert(memberships, {
          onConflict: 'player_term_id,team_term_id'
        });

      if (memberError) {
        throw new Error(memberError.message);
      }

      setSaving(false);
      router.replace(`/teams/${teamId}/roster`);
    } catch (err: unknown) {
      setSaving(false);
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign';
      setMsg(`Error: ${errorMessage}`);
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="h-12 bg-neutral-200 rounded animate-pulse" />
          <div className="h-64 bg-neutral-200 rounded animate-pulse" />
        </div>
      </main>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <div className="max-w-2xl mx-auto bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Assign players</h1>
            <p className="text-sm text-neutral-700">{team?.name || 'Team'}</p>
          </div>
          <Link
            href={`/teams/${teamId}/roster`}
            className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold"
          >
            Cancel
          </Link>
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
                      <label className="flex items-center gap-2 p-2 border border-neutral-200 rounded-md hover:bg-neutral-50 cursor-pointer">
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
