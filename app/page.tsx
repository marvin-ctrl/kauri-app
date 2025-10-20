// /app/dashboard/page.tsx
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

export default async function Dashboard() {
  try {
    // Quick ping to confirm envs are present
    if (!url || !key) throw new Error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');

    const { data: events, error } = await supabase
      .from('events')
      .select('id, starts_at, type, location')
      .order('starts_at');

    if (error) throw error;

    if (!events || events.length === 0) {
      return (
        <main className="mx-auto max-w-2xl p-4">
          <h1 className="mb-3 text-lg font-semibold">Schedule</h1>
          <p className="text-sm text-gray-600">No events found. Add one in Supabase → <code>events</code>.</p>
        </main>
      );
    }

    return (
      <main className="mx-auto max-w-2xl p-4">
        <h1 className="mb-3 text-lg font-semibold">Schedule</h1>
        <ul className="space-y-2">
          {events.map(e => (
            <li key={e.id} className="rounded border p-3">
              <div className="text-sm font-medium">
                {e.type} — {new Date(e.starts_at).toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">{e.location}</div>
            </li>
          ))}
        </ul>
      </main>
    );
  } catch (err: any) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <h1 className="mb-3 text-lg font-semibold">Schedule</h1>
        <pre className="whitespace-pre-wrap rounded border bg-gray-50 p-3 text-xs text-red-700">
{String(err?.message || err)}
        </pre>
        <p className="mt-2 text-xs text-gray-600">
          Checks: 1) Supabase has at least one <code>events</code> row.
          2) Vercel env vars set for Production+Preview.
          3) RLS off on <code>events</code> (for now).
          4) Redeploy after changing env vars.
        </p>
      </main>
    );
  }
}
