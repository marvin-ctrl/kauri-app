import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export default async function HomePage() {
  // Check if env vars are set
  if (!supabaseUrl || !supabaseKey) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <h1 className="mb-3 text-lg font-semibold">⚠️ Configuration Error</h1>
        <div className="rounded border border-red-300 bg-red-50 p-4">
          <p className="text-sm text-red-800 mb-2">Missing environment variables!</p>
          <p className="text-xs text-red-600">
            Create a <code className="bg-red-100 px-1 rounded">.env.local</code> file with:
          </p>
          <pre className="mt-2 bg-red-100 p-2 rounded text-xs">
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
          </pre>
        </div>
      </main>
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Fetch events from Supabase
    const { data: events, error } = await supabase
      .from('events')
      .select('id, starts_at, type, location')
      .order('starts_at');

    if (error) throw error;

    // No events found
    if (!events || events.length === 0) {
      return (
        <main className="mx-auto max-w-2xl p-4">
          <h1 className="mb-3 text-2xl font-bold">🏃 Kauri Futsal Schedule</h1>
          <div className="rounded border border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-gray-600">No events scheduled yet.</p>
            <p className="text-sm text-gray-500 mt-2">
              Add events in your Supabase dashboard → <code className="bg-gray-200 px-1 rounded">events</code> table
            </p>
          </div>
        </main>
      );
    }

    // Display events
    return (
      <main className="mx-auto max-w-2xl p-4">
        <h1 className="mb-6 text-2xl font-bold">🏃 Kauri Futsal Schedule</h1>
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-gray-900">{event.type}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    📍 {event.location}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(event.starts_at).toLocaleString('en-NZ', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  } catch (err: any) {
    // Error handling
    return (
      <main className="mx-auto max-w-2xl p-4">
        <h1 className="mb-3 text-lg font-semibold">❌ Error</h1>
        <div className="rounded border border-red-300 bg-red-50 p-4">
          <pre className="text-xs text-red-700 whitespace-pre-wrap">
            {err?.message || String(err)}
          </pre>
          <div className="mt-3 text-xs text-red-600">
            <p className="font-semibold mb-1">Troubleshooting:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Check your Supabase connection</li>
              <li>Verify the <code className="bg-red-100 px-1 rounded">events</code> table exists</li>
              <li>Turn off RLS (Row Level Security) for testing</li>
              <li>Restart your dev server after changing .env.local</li>
            </ul>
          </div>
        </div>
      </main>
    );
  }
}
