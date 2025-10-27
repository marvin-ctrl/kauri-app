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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [termId, setTermId] = useState<string | null>(null);

  async function loadData() {
    console.log('=== PAYMENTS PAGE: Loading data ===');
    setLoading(true);
    setError(null);

    const currentTermId = localStorage.getItem('kauri.termId');
    setTermId(currentTermId);

    console.log('Current term ID:', currentTermId);

    if (!currentTermId) {
      setError('Please select a term from the dropdown in the header first.');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Get all team_terms for current term
      console.log('Step 1: Loading team_terms for term:', currentTermId);
      const { data: teamTerms, error: teamTermsError } = await supabase
        .from('team_terms')
        .select('id, teams(name)')
        .eq('term_id', currentTermId);

      if (teamTermsError) {
        console.error('Error loading team_terms:', teamTermsError);
        setError(`Error loading teams: ${teamTermsError.message}`);
        setLoading(false);
        return;
      }

      console.log('Loaded team_terms:', teamTerms);

      if (!teamTerms || teamTerms.length === 0) {
        console.log('No teams found for this term');
        setError('No teams found for the current term. Please assign teams to this term first.');
        setTeams([]);
        setPayments([]);
        setLoading(false);
        return;
      }

      const teamTermIds = teamTerms.map(tt => tt.id);
      console.log('Team term IDs:', teamTermIds);

      // Step 2: Get fees for these teams
      console.log('Step 2: Loading team fees');
      const { data: fees, error: feesError } = await supabase
        .from('team_fees')
        .select('*')
        .in('team_term_id', teamTermIds);

      if (feesError) {
        console.error('Error loading team fees:', feesError);
        if (feesError.message.includes('relation "team_fees" does not exist')) {
          setError('❌ Database tables not created! Please run the migration. See PAYMENT_SETUP.md for instructions.');
        } else {
          setError(`Error loading team fees: ${feesError.message}`);
        }
        setLoading(false);
        return;
      }

      console.log('Loaded team fees:', fees);

      const feeMap = new Map(fees?.map(f => [f.team_term_id, f.amount]) || []);

      const teamsData = teamTerms.map(tt => ({
        teamTermId: tt.id,
        teamName: (tt.teams as any).name,
        currentFee: feeMap.get(tt.id) || null
      }));

      console.log('Teams data:', teamsData);
      setTeams(teamsData);

      // Step 3: Get all player payments
      console.log('Step 3: Loading player payments');
      const { data: playerPayments, error: paymentsError } = await supabase
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

      if (paymentsError) {
        console.error('Error loading player payments:', paymentsError);
        if (paymentsError.message.includes('relation "player_payments" does not exist')) {
          setError('❌ Database tables not created! Please run the migration. See PAYMENT_SETUP.md for instructions.');
        } else {
          setError(`Error loading player payments: ${paymentsError.message}`);
        }
        setLoading(false);
        return;
      }

      console.log('Loaded player payments:', playerPayments);

      if (playerPayments) {
        const paymentsData = playerPayments.map((p: any) => ({
          id: p.id,
          playerName: p.player_terms.players.preferred_name ||
                     `${p.player_terms.players.first_name} ${p.player_terms.players.last_name}`,
          teamName: p.team_terms.teams.name,
          amountDue: p.amount_due,
          amountPaid: p.amount_paid,
          paid: p.paid
        }));
        console.log('Processed payments data:', paymentsData);
        setPayments(paymentsData);
      } else {
        setPayments([]);
      }

      setLoading(false);
      console.log('=== PAYMENTS PAGE: Data loading complete ===');
    } catch (error: any) {
      console.error('Unexpected error loading payments:', error);
      setError(`Unexpected error: ${error.message}`);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function setTeamFee(teamTermId: string, amount: number) {
    console.log('=== Setting team fee ===');
    console.log('Team term ID:', teamTermId);
    console.log('Amount:', amount);

    setError(null);
    setSuccess(null);

    try {
      // Step 1: Upsert team fee
      console.log('Step 1: Upserting team fee');
      const { error: feeError } = await supabase.from('team_fees').upsert({
        team_term_id: teamTermId,
        amount
      }, { onConflict: 'team_term_id' });

      if (feeError) {
        console.error('Error setting team fee:', feeError);
        setError(`Failed to set team fee: ${feeError.message}`);
        return;
      }

      console.log('Team fee set successfully');

      // Step 2: Get memberships for this team
      console.log('Step 2: Loading memberships');
      const { data: memberships, error: membershipsError } = await supabase
        .from('memberships')
        .select('player_term_id')
        .eq('team_term_id', teamTermId);

      if (membershipsError) {
        console.error('Error loading memberships:', membershipsError);
        setError(`Failed to load team players: ${membershipsError.message}`);
        return;
      }

      console.log('Found memberships:', memberships);

      if (!memberships || memberships.length === 0) {
        setSuccess('Team fee set, but no players assigned to this team yet.');
        setEditingTeamFee(null);
        loadData();
        return;
      }

      // Step 3: Get existing payments to preserve amount_paid
      const playerTermIds = memberships.map(m => m.player_term_id);
      console.log('Step 3: Loading existing payments for player terms:', playerTermIds);

      const { data: existingPayments } = await supabase
        .from('player_payments')
        .select('player_term_id, amount_paid')
        .in('player_term_id', playerTermIds)
        .eq('team_term_id', teamTermId);

      const existingPaymentsMap = new Map(
        existingPayments?.map(p => [p.player_term_id, p.amount_paid]) || []
      );

      console.log('Existing payments map:', existingPaymentsMap);

      // Step 4: Create/update player payments
      const paymentRecords = memberships.map(m => ({
        player_term_id: m.player_term_id,
        team_term_id: teamTermId,
        amount_due: amount,
        amount_paid: existingPaymentsMap.get(m.player_term_id) || 0
      }));

      console.log('Step 4: Upserting payment records:', paymentRecords);

      const { error: paymentsError } = await supabase.from('player_payments').upsert(paymentRecords, {
        onConflict: 'player_term_id,team_term_id'
      });

      if (paymentsError) {
        console.error('Error updating player payments:', paymentsError);
        setError(`Failed to create player payments: ${paymentsError.message}`);
        return;
      }

      console.log('Player payments created/updated successfully');
      setSuccess(`✅ Team fee set to $${amount.toFixed(2)} and applied to ${memberships.length} player(s)`);
      setEditingTeamFee(null);
      loadData();
    } catch (error: any) {
      console.error('Unexpected error setting team fee:', error);
      setError(`Unexpected error: ${error.message}`);
    }
  }

  async function updatePayment(id: string, amountPaid: number) {
    console.log('=== Updating payment ===');
    console.log('Payment ID:', id);
    console.log('Amount paid:', amountPaid);

    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('player_payments')
        .update({ amount_paid: amountPaid })
        .eq('id', id);

      if (error) {
        console.error('Error updating payment:', error);
        setError(`Failed to update payment: ${error.message}`);
        return;
      }

      console.log('Payment updated successfully');
      setSuccess('✅ Payment updated');
      setEditingPayment(null);
      loadData();
    } catch (error: any) {
      console.error('Unexpected error updating payment:', error);
      setError(`Unexpected error: ${error.message}`);
    }
  }

  function exportCSV() {
    console.log('Exporting CSV');
    const csv = [
      ['Player', 'Team', 'Amount Due', 'Amount Paid', 'Balance', 'Paid'].join(','),
      ...payments.map(p => [
        `"${p.playerName}"`,
        `"${p.teamName}"`,
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
    setSuccess('✅ CSV exported');
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-white/20 bg-white/95 p-6 shadow-xl">
            <p className="text-center">Loading payments...</p>
          </div>
        </div>
      </main>
    );
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
          {!termId && (
            <p className="mt-2 text-sm font-semibold text-red-600">⚠️ No term selected. Please select a term from the dropdown in the header.</p>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-4 shadow-xl">
            <p className="text-sm font-semibold text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-green-300 bg-green-50 p-4 shadow-xl">
            <p className="text-sm font-semibold text-green-800">{success}</p>
          </div>
        )}

        {/* Summary */}
        {payments.length > 0 && (
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
        )}

        {/* Team Fees */}
        {teams.length > 0 && (
          <div className="rounded-2xl border border-white/20 bg-white/95 p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-[#172F56]">Team Fees</h2>
            <p className="mb-4 text-sm text-[#415572]">
              Set the default fee for each team. This will automatically create payment records for all players on the team.
            </p>
            <div className="space-y-2">
              {teams.map(team => (
                <div key={team.teamTermId} className="flex items-center justify-between border-b border-gray-200 pb-2 last:border-0">
                  <span className="font-semibold text-[#172F56]">{team.teamName}</span>
                  {editingTeamFee === team.teamTermId ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={team.currentFee || 0}
                        className="w-32 rounded border px-2 py-1 text-sm"
                        id={`fee-${team.teamTermId}`}
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById(`fee-${team.teamTermId}`) as HTMLInputElement;
                          const value = parseFloat(input.value);
                          if (isNaN(value) || value < 0) {
                            alert('Please enter a valid amount');
                            return;
                          }
                          setTeamFee(team.teamTermId, value);
                        }}
                        className="rounded bg-[#79CBC4] px-3 py-1 text-sm font-semibold text-[#0f223f] hover:bg-[#68b8b0]"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingTeamFee(null)}
                        className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[#172F56] font-semibold">
                        ${team.currentFee?.toFixed(2) || '0.00'}
                      </span>
                      <button
                        onClick={() => setEditingTeamFee(team.teamTermId)}
                        className="rounded bg-white px-3 py-1 text-sm font-semibold text-[#172F56] border border-[#172F56]/20 hover:bg-gray-50"
                      >
                        {team.currentFee ? 'Edit' : 'Set Fee'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Player Payments */}
        {payments.length > 0 ? (
          <div className="rounded-2xl border border-white/20 bg-white/95 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-[#172F56]">Player Payments</h2>
              <button
                onClick={exportCSV}
                className="rounded bg-white px-4 py-2 text-sm font-semibold text-[#172F56] border border-[#172F56]/20 hover:bg-gray-50"
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
                      <td className="px-4 py-3 text-right text-green-600 font-semibold">${payment.amountPaid.toFixed(2)}</td>
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
                              min="0"
                              max={payment.amountDue}
                              defaultValue={payment.amountPaid}
                              className="w-24 rounded border px-2 py-1 text-sm"
                              id={`paid-${payment.id}`}
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                const input = document.getElementById(`paid-${payment.id}`) as HTMLInputElement;
                                const value = parseFloat(input.value);
                                if (isNaN(value) || value < 0) {
                                  alert('Please enter a valid amount');
                                  return;
                                }
                                updatePayment(payment.id, value);
                              }}
                              className="rounded bg-[#79CBC4] px-2 py-1 text-xs font-semibold hover:bg-[#68b8b0]"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingPayment(null)}
                              className="rounded bg-gray-200 px-2 py-1 text-xs hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingPayment(payment.id)}
                            className="rounded bg-white px-3 py-1 text-xs font-semibold text-[#172F56] border border-[#172F56]/20 hover:bg-gray-50"
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
        ) : (
          teams.length > 0 && (
            <div className="rounded-2xl border border-white/20 bg-white/95 p-12 shadow-xl text-center">
              <p className="text-lg font-semibold text-[#172F56] mb-2">No player payments yet</p>
              <p className="text-sm text-[#415572]">
                Set team fees above to automatically create payment records for players.
              </p>
            </div>
          )
        )}
      </div>
    </main>
  );
}
