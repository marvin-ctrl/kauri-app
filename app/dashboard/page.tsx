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
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      // 1) get user client-side
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        router.replace('/login');
        return;
      }
      if (!mounted) return;
      setEmail(userData.user.email ?? null);

      // 2) fetch events client-side (ensure RLS OFF for now)
      const { data, error } = await supabase
        .from('events')
        .select('*, teams(name)')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(10);

      if (!mounted) return;
      if (error) {
        setEvents([]);
      } else {
        setEvents(data as EventRow[]);
      }
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center bg-gray-50">
        <p className="text-gray-600">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-600 text-sm">{email}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
          {!events || events.length === 0 ? (
            <p className="text-gray-500 py-8 text-center">No upcoming events.</p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="border rounded-lg p-4">
                  <div className="flex justify-between">
                    <div>
                      <div className="text-lg font-semibold">
                        {event.type === 'training' && '🏋️ '}
                        {event.type === 'game' && '⚽ '}
                        {event.type === 'tournament' && '🏆 '}
                        {event.title || event.type}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        📍 {event.location || 'TBC'} • {event.teams?.name || 'Unassigned'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(event.starts_at).toLocaleString('en-NZ', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
