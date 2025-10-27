'use client';
import { useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default function TeamSettingsPage({ params }: { params: { teamTermId: string } }) {
  const teamTermId = params.teamTermId;
  const [amount, setAmount] = useState<string>('');
  const [due, setDue] = useState<string>('');
  const [msg, setMsg] = useState<string | null>(null);

  async function loadInitial() {
    const { data, error } = await getSupabaseClient()
      .from('team_terms')
      .select('fee_amount, fee_due_date')
      .eq('id', teamTermId)
      .single();
    if (!error && data) {
      setAmount(data.fee_amount ?? '');
      setDue(data.fee_due_date ?? '');
    } else if (error) {
      setMsg(error.message);
    }
  }

  // lazy-load on first render
  useState(() => { void loadInitial(); return undefined; });

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const { error } = await getSupabaseClient().rpc('rpc_set_team_fee', {
      p_team_term_id: teamTermId,
      p_amount: Number(amount || 0),
      p_due_date: due || null,
    });
    if (error) setMsg(error.message);
    else setMsg('Saved');
  }

  return (
    <main className="p-6 max-w-md space-y-4">
      <Link href="/teams" className="underline">← Back to teams</Link>
      <h1 className="text-xl font-semibold">Team fee</h1>
      <form onSubmit={onSave} className="space-y-3 border rounded p-4">
        <div className="grid gap-1">
          <label className="text-sm">Fee amount</label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="border rounded px-2 py-1"
            required
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm">Due date</label>
          <input
            type="date"
            value={due ?? ''}
            onChange={e => setDue(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <button type="submit" className="px-3 py-1 border rounded">Save</button>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
    </main>
  );
}
