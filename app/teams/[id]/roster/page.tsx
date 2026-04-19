'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getActiveTermId, NO_RECORDS_FOR_SELECTED_TERM } from '@/lib/active-term';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Team = { id: string; name: string };
type RosterRow = {
  membershipId: string;
  playerId: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  jerseyNo: number | null;
  role: string;
};

export default function TeamRosterPage() {
  const { id: teamId } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);

    const { data: teamData } = await supabase.from('teams').select('id,name').eq('id', teamId).maybeSingle();
    setTeam(teamData || null);

    const { termId, message } = getActiveTermId();
    if (!termId) {
      setRoster([]);
      setMsg(message);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('memberships')
      .select(`
        id,
        role,
        player_terms!inner(
          players!inner(id, first_name, last_name, preferred_name, jersey_no)
        ),
        team_terms!inner(team_id, term_id)
      `)
      .eq('team_terms.team_id', teamId)
      .eq('team_terms.term_id', termId);

    if (error) {
      setRoster([]);
      setMsg(error.message);
      setLoading(false);
      return;
    }

    const mapped: RosterRow[] = (data || []).map((row: any) => ({
      membershipId: String(row.id),
      playerId: String(row.player_terms.players.id),
      firstName: String(row.player_terms.players.first_name),
      lastName: String(row.player_terms.players.last_name),
      preferredName: row.player_terms.players.preferred_name ?? null,
      jerseyNo: row.player_terms.players.jersey_no ?? null,
      role: String(row.role)
    }));

    setRoster(mapped);
    if (!mapped.length) setMsg(NO_RECORDS_FOR_SELECTED_TERM);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [teamId]);

  async function remove(membershipId: string) {
    setMsg(null);
    if (!confirm('Remove this player from the team?')) return;

    const { error } = await supabase.from('memberships').delete().eq('id', membershipId);
    if (error) {
      setMsg(`Error: ${error.message}`);
      return;
    }

    await load();
  }

  if (loading) return <main className="min-h-screen grid place-items-center">Loading…</main>;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{team?.name || 'Team'}</h1>
            <p className="text-sm text-neutral-700">Roster</p>
          </div>
          <div className="flex gap-2">
            <a href={`/teams/${teamId}/assign`} className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold">
              Add players
            </a>
            <a href="/teams" className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold">
              Back to Teams
            </a>
          </div>
        </header>

        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          {roster.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-700 mb-4">No records for selected term</p>
              <a href={`/teams/${teamId}/assign`} className="inline-block px-4 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold">
                Add players
              </a>
            </div>
          ) : (
            <ul className="space-y-2">
              {roster.map(row => {
                const name = row.preferredName || `${row.firstName} ${row.lastName}`;
                return (
                  <li key={row.membershipId} className="flex items-center justify-between border border-neutral-200 rounded-md p-3 hover:bg-neutral-50">
                    <div className="text-sm">
                      <span className="font-semibold">{name}</span>
                      {row.jerseyNo != null && <span className="ml-2 text-neutral-700">#{row.jerseyNo}</span>}
                      {row.role && row.role !== 'player' && <span className="ml-2 text-neutral-700">• {row.role}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={`/players/${row.playerId}`} className="text-sm underline text-blue-700 hover:text-blue-800">Profile</a>
                      <button onClick={() => remove(row.membershipId)} className="px-2 py-1 rounded bg-red-700 hover:bg-red-800 text-white text-xs">
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {msg && <p className="mt-3 text-sm text-red-800">{msg}</p>}
        </section>
      </div>
    </main>
  );
}
