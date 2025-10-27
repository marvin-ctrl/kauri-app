import { createClient } from '@/lib/supabase-server'; // adjust path
import { saveTeamFeeAction } from './actions';

export default async function TeamSettingsPage({
  params,
}: { params: { teamTermId: string } }) {
  const supabase = createClient();

  const { data: teamTerm, error } = await supabase
    .from('team_terms')
    .select('id, fee_amount, fee_due_date')
    .eq('id', params.teamTermId)
    .single();

  if (error) {
    return <div>Error loading team term: {error.message}</div>;
  }

  // ensure string for <input type="date">
  const due = teamTerm?.fee_due_date ?? '';
  const dueStr = typeof due === 'string' ? due : '';

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Team fee</h1>

      <form action={saveTeamFeeAction} className="space-y-4 border p-4 rounded">
        <input type="hidden" name="teamTermId" value={teamTerm.id} />

        <div className="grid gap-1">
          <label className="text-sm">Fee amount</label>
          <input
            name="feeAmount"
            type="number"
            step="0.01"
            defaultValue={teamTerm.fee_amount ?? ''}
            min={0}
            className="border rounded px-2 py-1 w-full"
            required
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm">Due date</label>
          <input
            name="feeDueDate"
            type="date"
            defaultValue={dueStr}
            className="border rounded px-2 py-1 w-full"
          />
        </div>

        <button type="submit" className="px-3 py-1 border rounded">Save</button>
      </form>
    </div>
  );
}
