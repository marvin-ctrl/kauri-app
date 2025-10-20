// /app/dashboard/page.tsx  (or /src/app/dashboard/page.tsx if you use src/)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function Dashboard() {
  const { data: events, error } = await supabase
    .from('events')
    .select('id, starts_at, type, location')
    .order('starts_at');

  if (error) {
    return <main className="mx-auto max-w-2xl p-4">Error: {error.message}</main>;
  }

  if (!events?.length) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <h1 className="mb-3 text-lg font-semibold">Schedule</h1>
        <p>No events yet. Add one in Supabase → <code>events</code>.</p>
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
}
   
