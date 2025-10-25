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
  const filteredRows = showPast
    ? rows
    : rows.filter(ev => new Date(ev.starts_at) >= now);

  if (loading) return <main className="min-h-screen grid place-items-center">Loading…</main>;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight text-black">Events</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPast(!showPast)}
              className="px-3 py-2 rounded-md bg-white hover:bg-neutral-100 text-black font-bold border-2 border-black"
            >
              {showPast ? 'Hide past events' : 'Show past events'}
            </button>
            <Link href="/events/new" className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-bold border-2 border-black">
              New event
            </Link>
          </div>
        </header>

        <section className="bg-white border-2 border-black rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="text-left p-3 font-bold">When</th>
                <th className="text-left p-3 font-bold">Type</th>
                <th className="text-left p-3 font-bold">Title</th>
                <th className="text-left p-3 font-bold">Location</th>
                <th className="text-left p-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(ev => (
                <tr key={ev.id} className="border-b-2 border-neutral-200 hover:bg-neutral-50">
                  <td className="p-3 font-semibold text-black">
                    {new Date(ev.starts_at).toLocaleString('en-NZ', {
                      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="p-3 font-semibold text-black">{ev.type}</td>
                  <td className="p-3 font-semibold text-black">{ev.title ?? '—'}</td>
                  <td className="p-3 font-semibold text-black">{ev.location ?? '—'}</td>
                  <td className="p-3 space-x-3">
                    <Link href={`/events/${ev.id}/edit`} className="underline text-blue-700 hover:text-blue-800 font-bold">
                      Edit
                    </Link>
                    <Link href={`/events/${ev.id}/roll`} className="underline text-blue-700 hover:text-blue-800 font-bold">
                      Take roll
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr><td className="p-4 text-black font-semibold" colSpan={5}>No events.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        {msg && <p className="text-sm text-red-800">{msg}</p>}
      </div>
    </main>
  );
}
