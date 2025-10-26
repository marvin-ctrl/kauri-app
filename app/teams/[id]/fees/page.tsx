'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Team = { id: string; name: string };
type TeamFee = {
  id: string;
  feeAmount: number;
  currency: string;
  notes: string | null;
};

export default function TeamFeesPage() {
  const { id: teamId } = useParams<{ id: string }>();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [teamFee, setTeamFee] = useState<TeamFee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [termId, setTermId] = useState<string | null>(null);

  // Form state
  const [feeAmount, setFeeAmount] = useState('0.00');
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    load();
  }, [teamId]);

  async function load() {
    setMsg(null);
    setLoading(true);

    try {
      // Get team info
      const { data: teamData } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', teamId)
        .maybeSingle();

      setTeam(teamData || null);

      // Get current term from localStorage
      const currentTermId = localStorage.getItem('kauri.termId');
      if (!currentTermId) {
        setMsg('Please select a term in the header.');
        setLoading(false);
        return;
      }
      setTermId(currentTermId);

      // Get team fee for this team and term
      const { data: feeData } = await supabase
        .from('team_fees')
        .select('id, fee_amount, currency, notes')
        .eq('team_id', teamId)
        .eq('term_id', currentTermId)
        .maybeSingle();

      if (feeData) {
        const fee: TeamFee = {
          id: feeData.id,
          feeAmount: parseFloat(feeData.fee_amount),
          currency: feeData.currency || 'USD',
          notes: feeData.notes
        };
        setTeamFee(fee);
        setFeeAmount(fee.feeAmount.toFixed(2));
        setCurrency(fee.currency);
        setNotes(fee.notes || '');
      }

      setLoading(false);
    } catch (err: any) {
      setMsg(`Error: ${err?.message || 'Failed to load team fees'}`);
      setLoading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);

    if (!termId) {
      setMsg('No term selected');
      setSaving(false);
      return;
    }

    try {
      const amount = parseFloat(feeAmount);
      if (isNaN(amount) || amount < 0) {
        setMsg('Invalid fee amount');
        setSaving(false);
        return;
      }

      if (teamFee) {
        // Update existing fee
        const { error } = await supabase
          .from('team_fees')
          .update({
            fee_amount: amount,
            currency: currency,
            notes: notes || null
          })
          .eq('id', teamFee.id);

        if (error) throw error;
        setMsg('Fee updated successfully');
      } else {
        // Create new fee
        const { error } = await supabase
          .from('team_fees')
          .insert({
            team_id: teamId,
            term_id: termId,
            fee_amount: amount,
            currency: currency,
            notes: notes || null
          });

        if (error) throw error;
        setMsg('Fee created successfully');
      }

      setSaving(false);
      await load();
    } catch (err: any) {
      setMsg(`Error: ${err?.message || 'Failed to save fee'}`);
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="min-h-screen grid place-items-center">Loading…</main>;
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{team?.name || 'Team'}</h1>
            <p className="text-sm text-neutral-700">Manage Team Fees</p>
          </div>
          <a
            href={`/teams/${teamId}/roster`}
            className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold"
          >
            Back to Roster
          </a>
        </header>

        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          <form onSubmit={save} className="space-y-4">
            <div>
              <label htmlFor="currency" className="block text-sm font-semibold mb-1">
                Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
                <option value="NZD">NZD ($)</option>
              </select>
            </div>

            <div>
              <label htmlFor="feeAmount" className="block text-sm font-semibold mb-1">
                Fee Amount
              </label>
              <input
                type="number"
                id="feeAmount"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-semibold mb-1">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any notes about this fee..."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-md bg-green-700 hover:bg-green-800 text-white font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving...' : teamFee ? 'Update Fee' : 'Create Fee'}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/teams/${teamId}/roster`)}
                className="px-4 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold"
              >
                Cancel
              </button>
            </div>

            {msg && (
              <p className={`text-sm ${msg.includes('Error') ? 'text-red-800' : 'text-green-800'}`}>
                {msg}
              </p>
            )}
          </form>
        </section>

        <section className="bg-blue-50 border border-blue-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-2">How it works</h2>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li>• Set the fee amount for this team for the current term</li>
            <li>• Each team can have different fees per term</li>
            <li>• When you mark a player as paid in the roster, they will be charged this amount</li>
            <li>• You can change the fee amount at any time - existing payments will retain their original amounts</li>
            <li>• The roster will show payment status and totals for all players</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
