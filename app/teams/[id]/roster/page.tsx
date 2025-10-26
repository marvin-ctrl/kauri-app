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
  firstName: string;
  lastName: string;
  preferredName: string | null;
  jerseyNo: number | null;
  role: string;
  paymentId: string | null;
  paid: boolean;
  amountPaid: number;
  paymentDate: string | null;
};
type TeamFee = {
  id: string;
  feeAmount: number;
  currency: string;
};

export default function TeamRosterPage() {
  const { id: teamId } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [teamFee, setTeamFee] = useState<TeamFee | null>(null);
  const [termId, setTermId] = useState<string | null>(null);

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
      const currentTermId = localStorage.getItem('kauri.termId');
      if (!currentTermId) {
        setMsg('Please select a term in the header.');
        setLoading(false);
        return;
      }
      setTermId(currentTermId);

      // 2a. Get team fee for this team and term
      const { data: feeData } = await supabase
        .from('team_fees')
        .select('id, fee_amount, currency')
        .eq('team_id', teamId)
        .eq('term_id', currentTermId)
        .maybeSingle();

      setTeamFee(feeData ? {
        id: feeData.id,
        feeAmount: parseFloat(feeData.fee_amount),
        currency: feeData.currency || 'USD'
      } : null);

      // 3. Get team_terms row for this team + term
      const { data: teamTerm } = await supabase
        .from('team_terms')
        .select('id')
        .eq('team_id', teamId)
        .eq('term_id', currentTermId)
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

      // 6a. Get payment data for all players in this team/term
      const { data: payments } = await supabase
        .from('player_payments')
        .select('id, player_id, amount_paid, paid, payment_date')
        .eq('team_id', teamId)
        .eq('term_id', currentTermId)
        .in('player_id', playerIds);

      // 7. Build roster by combining everything
      const playerMap = new Map(players?.map(p => [p.id, p]) || []);
      const playerTermMap = new Map(playerTerms.map(pt => [pt.id, pt.player_id]));
      const paymentMap = new Map(payments?.map(p => [p.player_id, p]) || []);

      const rosterData: RosterRow[] = memberships
        .map(m => {
          const playerId = playerTermMap.get(m.player_term_id);
          if (!playerId) return null;

          const player = playerMap.get(playerId);
          if (!player) return null;

          const payment = paymentMap.get(playerId);

          return {
            membershipId: m.id,
            playerId: player.id,
            firstName: player.first_name,
            lastName: player.last_name,
            preferredName: player.preferred_name,
            jerseyNo: player.jersey_no,
            role: m.role || 'player',
            paymentId: payment?.id || null,
            paid: payment?.paid || false,
            amountPaid: payment ? parseFloat(payment.amount_paid) : 0,
            paymentDate: payment?.payment_date || null
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

  async function togglePayment(playerId: string, currentPaid: boolean, paymentId: string | null) {
    setMsg(null);
    if (!termId) return;

    try {
      if (paymentId) {
        // Update existing payment
        const { error } = await supabase
          .from('player_payments')
          .update({
            paid: !currentPaid,
            payment_date: !currentPaid ? new Date().toISOString().split('T')[0] : null,
            amount_paid: teamFee?.feeAmount || 0
          })
          .eq('id', paymentId);

        if (error) throw error;
      } else {
        // Create new payment record
        const { error } = await supabase
          .from('player_payments')
          .insert({
            player_id: playerId,
            team_id: teamId,
            term_id: termId,
            paid: true,
            amount_paid: teamFee?.feeAmount || 0,
            payment_date: new Date().toISOString().split('T')[0]
          });

        if (error) throw error;
      }

      await load();
    } catch (err: any) {
      setMsg(`Error: ${err?.message || 'Failed to update payment'}`);
    }
  }

  if (loading) {
    return <main className="min-h-screen grid place-items-center">Loading…</main>;
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{team?.name || 'Team'}</h1>
            <p className="text-sm text-neutral-700">Roster</p>
            {teamFee && (
              <p className="text-sm text-neutral-600 mt-1">
                Team Fee: {teamFee.currency} ${teamFee.feeAmount.toFixed(2)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <a
              href={`/teams/${teamId}/fees`}
              className="px-3 py-2 rounded-md bg-green-700 hover:bg-green-800 text-white font-semibold"
            >
              Manage Fees
            </a>
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

        {roster.length > 0 && (
          <section className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Payment Summary</h2>
              <div className="text-sm text-neutral-700">
                {roster.filter(r => r.paid).length} / {roster.length} paid
                {teamFee && (
                  <span className="ml-3 font-semibold">
                    Total: {teamFee.currency} ${(roster.filter(r => r.paid).length * teamFee.feeAmount).toFixed(2)} / ${(roster.length * teamFee.feeAmount).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </section>
        )}

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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-2 px-3 text-sm font-semibold">Name</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold">Jersey</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold">Role</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold">Payment Status</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold">Amount</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold">Date Paid</th>
                    <th className="text-right py-2 px-3 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((row) => {
                    const name = row.preferredName || `${row.firstName} ${row.lastName}`;
                    return (
                      <tr
                        key={row.membershipId}
                        className="border-b border-neutral-100 hover:bg-neutral-50"
                      >
                        <td className="py-3 px-3 text-sm font-semibold">{name}</td>
                        <td className="py-3 px-3 text-sm text-neutral-700">
                          {row.jerseyNo != null ? `#${row.jerseyNo}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-sm text-neutral-700 capitalize">
                          {row.role || 'player'}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => togglePayment(row.playerId, row.paid, row.paymentId)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              row.paid
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {row.paid ? 'Paid' : 'Unpaid'}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-sm text-neutral-700">
                          {row.paid && teamFee
                            ? `${teamFee.currency} $${row.amountPaid.toFixed(2)}`
                            : '-'}
                        </td>
                        <td className="py-3 px-3 text-sm text-neutral-700">
                          {row.paymentDate || '-'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {msg && <p className="mt-3 text-sm text-red-800">{msg}</p>}
        </section>
      </div>
    </main>
  );
}
