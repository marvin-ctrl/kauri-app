'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Team = { id: string; name: string };
type EventRow = {
  id: string;
  type: 'training' | 'game' | 'tournament';
  title?: string | null;
  location: string | null;
  starts_at: string;
  teams: Team | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      setEmail(user.email ?? null);

      const { data, error } = await supabase
        .from('events')
        .select('*, teams(name)')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(20);

      setEvents(error ? [] : (data as EventRow[]));
      setLoading(false);
    })();
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) return <main className="min-h-screen grid place-items-center">Loading…</main>;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-gray-600">{email}</p>
          </div>
          <button onClick={signOut} className="px-3 py-2 rounded bg-gray-900 text-white">
            Sign out
          </button>
        </header>

        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
          {!events || events.length === 0 ? (
            <p className="text-gray-500">No upcoming events.</p>
          ) : (
            <ul className="space-y-3">
              {events.map(e => (
                <li key={e.id} className="border rounded-lg p-4">
                  <div className="text-lg font-semibold">
                    {e.type === 'training' && '🏋️ '}
                    {e.type === 'game' && '⚽ '}
                    {e.type === 'tournament' && '🏆 '}
                    {e.title || e.type}
                  </div>
                  <div className="text-sm text-gray-600">
                    📍 {e.location || 'TBC'} • {e.teams?.name || 'Unassigned'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(e.starts_at).toLocaleString('en-NZ', {
                      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
