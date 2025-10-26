'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/lib/supabase';
import { useAuthGuard } from '@/lib/auth-guard';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { isValidUUID } from '@/lib/validation';

type Team = { id: string; name: string };

export default function AssignPlayerToTeamsPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuthGuard();
  const router = useRouter();
  const { id: playerId } = useParams<{ id: string }>();
  const supabase = useSupabase();

  const [teams, setTeams] = useState<Team[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [role, setRole] = useState<'player' | 'captain'>('player');
  const [joinedAt, setJoinedAt] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    if (!isValidUUID(String(playerId))) {
      setMsg('Invalid player ID');
      return;
    }
    const { data } = await supabase.from('teams').select('id,name').order('name');
    setTeams(data || []);
  }, [playerId, supabase]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTeams();
    }
  }, [isAuthenticated, loadTeams]);

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
      const termId = typeof window !== 'undefined'
        ? localStorage.getItem(LOCAL_STORAGE_KEYS.TERM_ID)
        : null;

      if (!termId) {
        setMsg('Select a term in the header.');
        setSaving(false);
        return;
      }

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

      // 2) FIXED: Batch query team_terms to avoid N+1 problem
      const teamIds = Array.from(selected);

      // Single query to get all existing team_terms
      const { data: existingTTs } = await supabase
        .from('team_terms')
        .select('id, team_id')
        .in('team_id', teamIds)
        .eq('term_id', termId);

      const teamTermMap = new Map(existingTTs?.map(tt => [tt.team_id, tt.id]) || []);

      // Batch insert missing team_terms
      const missingTeamIds = teamIds.filter(tid => !teamTermMap.has(tid));
      if (missingTeamIds.length > 0) {
        const { data: newTTs, error: insertError } = await supabase
          .from('team_terms')
          .insert(missingTeamIds.map(tid => ({ team_id: tid, term_id: termId })))
          .select('id, team_id');

        if (insertError) {
          throw new Error(insertError.message || 'Failed to create team_terms');
        }

        newTTs?.forEach(tt => teamTermMap.set(tt.team_id, tt.id));
      }

      const teamTermIds = Array.from(teamTermMap.values());

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
          <h1 className="text-3xl font-extrabold tracking-tight">Assign to teams</h1>
          <Link
            href={`/players/${playerId}`}
            className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold"
          >
            Cancel
          </Link>
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
              {teams.length === 0 && <li className="text-sm text-neutral-700">No teams yet.</li>}
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
              className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
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
