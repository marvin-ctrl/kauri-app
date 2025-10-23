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

  if (loading) {
    return <main className="min-h-screen grid place-items-center bg-neutral-50 text-neutral-900">Loading…</main>;
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
            <p className="text-sm text-neutral-700">{email}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/players"
              className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold"
            >
              Players
            </a>
            <a
              href="/events/new"
              className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold"
            >
              New event
            </a>
            <button
              onClick={signOut}
              className="px-3 py-2 rounded-md bg-neutral-900 hover:bg-black text-white font-semibold"
            >
              Sign out
            </button>
          </div>
        </header>

        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
          {!events || events.length === 0 ? (
            <p className="text-neutral-700">No upcoming events.</p>
          ) : (
            <ul className="space-y-3">
              {events.map(e => (
                <li key={e.id} className="border border-neutral-200 rounded-lg p-4 hover:border-neutral-300">
                  <div className="text-lg font-semibold">
                    {e.type === 'training' && '🏋️ '}
                    {e.type === 'game' && '⚽ '}
                    {e.type === 'tournament' && '🏆 '}
                    <a
                      href={`/events/${e.id}/edit`}
                      className="underline text-blue-700 hover:text-blue-800"
                    >
                      {e.title || e.type}
                    </a>
                  </div>
                  <div className="text-sm text-neutral-800 mt-1">
                    📍 {e.location || 'TBC'} • {e.teams?.name || 'Unassigned'}
                  </div>
                  <div className="text-sm text-neutral-700 mt-1">
                    {new Date(e.starts_at).toLocaleString('en-NZ', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
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
