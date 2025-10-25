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

  if (loading) return <main className="min-h-screen grid place-items-center">Loading…</main>;

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172F56]">Events</h1>
          <Link href="/events/new" className="px-3 py-2 rounded-md bg-[#172F56] hover:bg-[#1e3a5f] text-white font-semibold text-center whitespace-nowrap">
            New event
          </Link>
        </header>

        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
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
              {rows.map(ev => (
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
                    <Link href={`/events/${ev.id}/roll`} className="underline text-blue-700 hover:text-blue-800">
                      Take roll
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td className="p-4 text-neutral-700" colSpan={5}>No events.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </section>

        {msg && <p className="text-sm text-red-800">{msg}</p>}
      </div>
    </main>
  );
}
