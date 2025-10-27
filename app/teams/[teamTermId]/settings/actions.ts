'use server';

import { createClient } from '@/lib/supabase-server'; // adjust if your server client path differs

export async function saveTeamFeeAction(formData: FormData) {
  const teamTermId = formData.get('teamTermId') as string;
  const amountStr = (formData.get('feeAmount') as string) ?? '0';
  const dueStr = (formData.get('feeDueDate') as string) || null;

  const amount = Number(amountStr);
  if (Number.isNaN(amount) || amount < 0) {
    throw new Error('Fee amount must be a non-negative number');
  }

  // YYYY-MM-DD for Postgres DATE
  const due = dueStr ? new Date(dueStr).toISOString().slice(0, 10) : null;

  const supabase = createClient();

  const { error } = await supabase.rpc('rpc_set_team_fee', {
    p_team_term_id: teamTermId,
    p_amount: amount,
    p_due_date: due,
  });

  if (error) throw new Error(error.message);
}
