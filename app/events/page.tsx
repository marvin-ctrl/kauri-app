'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type EventRow = {
  id: string;
  title: string | null;
  type: string;
  location: string | null;
  starts_at: string;
};

export default function EventsPage() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg(null);
      const { data, error } = await supabase
        .from('events')
        .select('id, title, type, location, starts_at')
        .order('starts_at', { ascending: true });
      if (error) setMsg(error.message);
      setRows(data || []);
      setLoading(false);
    })();
  }, []);

  const now = new Date();
  const filteredEvents = showPast
    ? rows
    : rows.filter(ev => new Date(ev.starts_at) >= now);

  if (loading) return <main className="min-h-screen grid place-items-center">Loading…</main>;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Events</h1>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowPast(!showPast)}
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                showPast
                  ? 'bg-[#172F56] text-white'
                  : 'bg-white border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {showPast ? 'Hide past events' : 'Show past events'}
            </button>
            <Link href="/events/new" className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold">
              New event
            </Link>
          </div>
        </header>

        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 border-b border-neutral-200">
              <tr>
                <th className="text-left p-3">When</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Location</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map(ev => (
                <tr key={ev.id} className="border-b border-neutral-100">
                  <td className="p-3">
                    {new Date(ev.starts_at).toLocaleString('en-NZ', {
                      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="p-3">{ev.type}</td>
                  <td className="p-3">{ev.title ?? '—'}</td>
                  <td className="p-3">{ev.location ?? '—'}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link href={`/events/${ev.id}/roll`} className="underline text-blue-700 hover:text-blue-800">
                        Take roll
                      </Link>
                      <span className="text-neutral-300">•</span>
                      <Link href={`/events/${ev.id}/edit`} className="underline text-neutral-700 hover:text-neutral-900">
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEvents.length === 0 && (
                <tr><td className="p-4 text-neutral-700" colSpan={5}>No events.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        {msg && <p className="text-sm text-red-800">{msg}</p>}
      </div>
    </main>
  );
}
