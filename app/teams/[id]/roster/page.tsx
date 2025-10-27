'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Team = { id: string; name: string };
type RosterRow = {
  membershipId: string;
  playerId: string;
  playerTermId: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  jerseyNo: number | null;
  role: string;
  paid?: boolean;
  amountDue?: number;
  amountPaid?: number;
};

export default function TeamRosterPage() {
  const { id: teamId } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    setLoading(true);

    try {
      // 1. Get team info
      const { data: teamData } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', teamId)
        .maybeSingle();
      
      setTeam(teamData || null);

      // 2. Get current term from localStorage
      const termId = localStorage.getItem('kauri.termId');
      if (!termId) {
        setMsg('Please select a term in the header.');
        setLoading(false);
        return;
      }

      // 3. Get team_terms row for this team + term
      const { data: teamTerm } = await supabase
        .from('team_terms')
        .select('id')
        .eq('team_id', teamId)
        .eq('term_id', termId)
        .maybeSingle();

      if (!teamTerm) {
        // No team_terms means no players assigned yet for this term
        setRoster([]);
        setLoading(false);
        return;
      }

      // 4. Get all memberships for this team_term
      const { data: memberships } = await supabase
        .from('memberships')
        .select('id, player_term_id, role')
        .eq('team_term_id', teamTerm.id);

      if (!memberships || memberships.length === 0) {
        setRoster([]);
        setLoading(false);
        return;
      }

      // 5. Get player_terms for these memberships
      const playerTermIds = memberships.map(m => m.player_term_id);
      const { data: playerTerms } = await supabase
        .from('player_terms')
        .select('id, player_id')
        .in('id', playerTermIds);

      if (!playerTerms || playerTerms.length === 0) {
        setRoster([]);
        setLoading(false);
        return;
      }

      // 6. Get actual player data
      const playerIds = playerTerms.map(pt => pt.player_id);
      const { data: players } = await supabase
        .from('players')
        .select('id, first_name, last_name, preferred_name, jersey_no')
        .in('id', playerIds);

      // 7. Get payment info
      const { data: paymentData } = await supabase
        .from('player_payments')
        .select('player_term_id, amount_due, amount_paid, paid')
        .in('player_term_id', playerTermIds)
        .eq('team_term_id', teamTerm.id);

      const paymentMap = new Map(paymentData?.map(p => [p.player_term_id, p]) || []);

      // 8. Build roster by combining everything
      const playerMap = new Map(players?.map(p => [p.id, p]) || []);
      const playerTermMap = new Map(playerTerms.map(pt => [pt.id, pt.player_id]));

      const rosterData: RosterRow[] = memberships
        .map(m => {
          const playerId = playerTermMap.get(m.player_term_id);
          if (!playerId) return null;

          const player = playerMap.get(playerId);
          if (!player) return null;

          const payment = paymentMap.get(m.player_term_id);

          return {
            membershipId: m.id,
            playerId: player.id,
            playerTermId: m.player_term_id,
            firstName: player.first_name,
            lastName: player.last_name,
            preferredName: player.preferred_name,
            jerseyNo: player.jersey_no,
            role: m.role || 'player',
            paid: payment?.paid,
            amountDue: payment?.amount_due,
            amountPaid: payment?.amount_paid
          };
        })
        .filter((row): row is RosterRow => row !== null);

      setRoster(rosterData);
      setLoading(false);
    } catch (err: any) {
      setMsg(`Error: ${err?.message || 'Failed to load roster'}`);
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [teamId]);

  async function remove(membershipId: string) {
    setMsg(null);
    if (!confirm('Remove this player from the team?')) return;
    
    const { error } = await supabase
      .from('memberships')
      .delete()
      .eq('id', membershipId);
    
    if (error) {
      setMsg(`Error: ${error.message}`);
      return;
    }
    
    await load();
  }

  if (loading) {
    return <main className="min-h-screen grid place-items-center">Loading…</main>;
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{team?.name || 'Team'}</h1>
            <p className="text-sm text-neutral-700">Roster</p>
          </div>
          <div className="flex gap-2">
            <a
              href={`/teams/${teamId}/assign`}
              className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold"
            >
              Add players
            </a>
            <a
              href="/teams"
              className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold"
            >
              Back to Teams
            </a>
          </div>
        </header>

        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          {roster.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-700 mb-4">No players on this team for the current term.</p>
              <a
                href={`/teams/${teamId}/assign`}
                className="inline-block px-4 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold"
              >
                Add players
              </a>
            </div>
          ) : (
            <ul className="space-y-2">
              {roster.map((row) => {
                const name = row.preferredName || `${row.firstName} ${row.lastName}`;
                return (
                  <li
                    key={row.membershipId}
                    className="flex items-center justify-between border border-neutral-200 rounded-md p-3 hover:bg-neutral-50"
                  >
                    <div className="text-sm flex items-center gap-2">
                      <div>
                        <span className="font-semibold">{name}</span>
                        {row.jerseyNo != null && (
                          <span className="ml-2 text-neutral-700">#{row.jerseyNo}</span>
                        )}
                        {row.role && row.role !== 'player' && (
                          <span className="ml-2 text-neutral-700">• {row.role}</span>
                        )}
                      </div>
                      {row.amountDue !== undefined && (
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          row.paid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {row.paid ? 'Paid' : `$${((row.amountDue || 0) - (row.amountPaid || 0)).toFixed(0)} due`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/players/${row.playerId}`}
                        className="text-sm underline text-blue-700 hover:text-blue-800"
                      >
                        Profile
                      </a>
                      <button
                        onClick={() => remove(row.membershipId)}
                        className="px-2 py-1 rounded bg-red-700 hover:bg-red-800 text-white text-xs"
                      >
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
