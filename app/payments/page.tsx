'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Payment = {
  id: string;
  playerName: string;
  teamName: string;
  amountDue: number;
  amountPaid: number;
  paid: boolean;
};

type TeamForFee = {
  teamTermId: string;
  teamName: string;
  currentFee: number | null;
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [teams, setTeams] = useState<TeamForFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [editingTeamFee, setEditingTeamFee] = useState<string | null>(null);

  async function loadData() {
    const termId = localStorage.getItem('kauri.termId');
    if (!termId) {
      setLoading(false);
      return;
    }

    try {
      // Get all team_terms for current term
      const { data: teamTerms } = await supabase
        .from('team_terms')
        .select('id, teams(name)')
        .eq('term_id', termId);

      if (teamTerms) {
        // Get fees for these teams
        const teamTermIds = teamTerms.map(tt => tt.id);
        const { data: fees } = await supabase
          .from('team_fees')
          .select('*')
          .in('team_term_id', teamTermIds);

        const feeMap = new Map(fees?.map(f => [f.team_term_id, f.amount]) || []);

        setTeams(teamTerms.map(tt => ({
          teamTermId: tt.id,
          teamName: (tt.teams as any).name,
          currentFee: feeMap.get(tt.id) || null
        })));

        // Get all player payments
        const { data: playerPayments } = await supabase
          .from('player_payments')
          .select(`
            id,
            amount_due,
            amount_paid,
            paid,
            player_terms!inner(players!inner(first_name, last_name, preferred_name)),
            team_terms!inner(teams!inner(name))
          `)
          .in('team_term_id', teamTermIds);

        if (playerPayments) {
          setPayments(playerPayments.map((p: any) => ({
            id: p.id,
            playerName: p.player_terms.players.preferred_name ||
                       `${p.player_terms.players.first_name} ${p.player_terms.players.last_name}`,
            teamName: p.team_terms.teams.name,
            amountDue: p.amount_due,
            amountPaid: p.amount_paid,
            paid: p.paid
          })));
        }
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function setTeamFee(teamTermId: string, amount: number) {
    try {
      // Upsert team fee
      await supabase.from('team_fees').upsert({
        team_term_id: teamTermId,
        amount
      }, { onConflict: 'team_term_id' });

      // Create/update player payments for all players in this team
      const { data: memberships } = await supabase
        .from('memberships')
        .select('player_term_id')
        .eq('team_term_id', teamTermId);

      if (memberships) {
        const paymentRecords = memberships.map(m => ({
          player_term_id: m.player_term_id,
          team_term_id: teamTermId,
          amount_due: amount,
          amount_paid: 0
        }));

        await supabase.from('player_payments').upsert(paymentRecords, {
          onConflict: 'player_term_id,team_term_id',
          ignoreDuplicates: false
        });
      }

      setEditingTeamFee(null);
      loadData();
    } catch (error) {
      console.error('Error setting team fee:', error);
    }
  }

  async function updatePayment(id: string, amountPaid: number) {
    try {
      await supabase
        .from('player_payments')
        .update({ amount_paid: amountPaid })
        .eq('id', id);

      setEditingPayment(null);
      loadData();
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  }

  function exportCSV() {
    const csv = [
      ['Player', 'Team', 'Amount Due', 'Amount Paid', 'Balance', 'Paid'].join(','),
      ...payments.map(p => [
        p.playerName,
        p.teamName,
        p.amountDue.toFixed(2),
        p.amountPaid.toFixed(2),
        (p.amountDue - p.amountPaid).toFixed(2),
        p.paid ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  if (loading) {
    return <main className="min-h-screen p-6"><p>Loading...</p></main>;
  }

  const totalDue = payments.reduce((sum, p) => sum + p.amountDue, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const paidCount = payments.filter(p => p.paid).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0d1b35] via-[#1a2942] to-[#0d1b35] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-white/20 bg-white/95 p-6 shadow-xl backdrop-blur">
          <h1 className="text-3xl font-bold text-[#172F56]">Payments</h1>
          <p className="text-sm text-[#415572]">Manage team fees and player payments (NZD)</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/20 bg-white/95 p-6 shadow-xl">
            <p className="text-sm text-[#415572]">Total Expected</p>
            <p className="text-2xl font-bold text-[#172F56]">${totalDue.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/95 p-6 shadow-xl">
            <p className="text-sm text-[#415572]">Total Collected</p>
            <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/95 p-6 shadow-xl">
            <p className="text-sm text-[#415572]">Outstanding</p>
            <p className="text-2xl font-bold text-red-600">${(totalDue - totalPaid).toFixed(2)}</p>
            <p className="text-xs text-[#415572]">{paidCount} of {payments.length} paid</p>
          </div>
        </div>

        {/* Team Fees */}
        <div className="rounded-2xl border border-white/20 bg-white/95 p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-bold text-[#172F56]">Team Fees</h2>
          <div className="space-y-2">
            {teams.map(team => (
              <div key={team.teamTermId} className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="font-semibold text-[#172F56]">{team.teamName}</span>
                {editingTeamFee === team.teamTermId ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={team.currentFee || 0}
                      className="w-32 rounded border px-2 py-1"
                      id={`fee-${team.teamTermId}`}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById(`fee-${team.teamTermId}`) as HTMLInputElement;
                        setTeamFee(team.teamTermId, parseFloat(input.value));
                      }}
                      className="rounded bg-[#79CBC4] px-3 py-1 text-sm font-semibold text-[#0f223f]"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTeamFee(null)}
                      className="rounded bg-gray-200 px-3 py-1 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[#172F56]">
                      ${team.currentFee?.toFixed(2) || '0.00'}
                    </span>
                    <button
                      onClick={() => setEditingTeamFee(team.teamTermId)}
                      className="rounded bg-white px-3 py-1 text-sm font-semibold text-[#172F56] border border-[#172F56]/20"
                    >
                      {team.currentFee ? 'Edit' : 'Set Fee'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Player Payments */}
        <div className="rounded-2xl border border-white/20 bg-white/95 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold text-[#172F56]">Player Payments</h2>
            <button
              onClick={exportCSV}
              className="rounded bg-white px-4 py-2 text-sm font-semibold text-[#172F56] border border-[#172F56]/20"
            >
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Player</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Team</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Due</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Paid</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Balance</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-[#172F56]">{payment.playerName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{payment.teamName}</td>
                    <td className="px-4 py-3 text-right font-semibold">${payment.amountDue.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-green-600">${payment.amountPaid.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">
                      ${(payment.amountDue - payment.amountPaid).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {payment.paid ? (
                        <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingPayment === payment.id ? (
                        <div className="flex justify-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={payment.amountPaid}
                            className="w-24 rounded border px-2 py-1 text-sm"
                            id={`paid-${payment.id}`}
                          />
                          <button
                            onClick={() => {
                              const input = document.getElementById(`paid-${payment.id}`) as HTMLInputElement;
                              updatePayment(payment.id, parseFloat(input.value));
                            }}
                            className="rounded bg-[#79CBC4] px-2 py-1 text-xs font-semibold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPayment(null)}
                            className="rounded bg-gray-200 px-2 py-1 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingPayment(payment.id)}
                          className="rounded bg-white px-3 py-1 text-xs font-semibold text-[#172F56] border border-[#172F56]/20"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
