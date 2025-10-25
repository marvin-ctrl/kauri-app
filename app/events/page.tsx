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
  attendance_count?: number;
  present_count?: number;
  late_count?: number;
  absent_count?: number;
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
        .order('starts_at', { ascending: false });
      if (error) {
        setMsg(error.message);
        setLoading(false);
        return;
      }

      // Load attendance counts for each event
      const events = data || [];
      const eventsWithAttendance = await Promise.all(
        events.map(async (event) => {
          const { data: attendance } = await supabase
            .from('attendance')
            .select('status')
            .eq('event_id', event.id);

          const counts = {
            attendance_count: attendance?.length || 0,
            present_count: attendance?.filter(a => a.status === 'present').length || 0,
            late_count: attendance?.filter(a => a.status === 'late').length || 0,
            absent_count: attendance?.filter(a => a.status === 'absent').length || 0,
          };

          return { ...event, ...counts };
        })
      );

      setRows(eventsWithAttendance);
      setLoading(false);
    })();
  }, []);

  if (loading) return <main className="min-h-screen grid place-items-center">Loading…</main>;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Events</h1>
          <Link href="/events/new" className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold">
            New event
          </Link>
        </header>

        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 border-b border-neutral-200">
              <tr>
                <th className="text-left p-3">When</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Location</th>
                <th className="text-left p-3">Roll Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(ev => {
                const eventDate = new Date(ev.starts_at);
                const isPast = eventDate < new Date();
                const hasAttendance = (ev.attendance_count || 0) > 0;

                return (
                  <tr key={ev.id} className={`border-b border-neutral-100 ${isPast ? 'bg-neutral-50' : ''}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {isPast && <span className="text-xs text-neutral-500">PAST</span>}
                        <span className={isPast ? 'text-neutral-600' : ''}>
                          {eventDate.toLocaleString('en-NZ', {
                            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">{ev.type}</td>
                    <td className="p-3">{ev.title ?? '—'}</td>
                    <td className="p-3">{ev.location ?? '—'}</td>
                    <td className="p-3">
                      {hasAttendance ? (
                        <div className="flex gap-2 text-xs">
                          <span className="text-green-700" title="Present">{ev.present_count}✓</span>
                          <span className="text-amber-600" title="Late">{ev.late_count}⏱</span>
                          <span className="text-red-700" title="Absent">{ev.absent_count}✗</span>
                        </div>
                      ) : (
                        <span className="text-neutral-400 text-xs">No roll taken</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Link href={`/events/${ev.id}/roll`} className="underline text-blue-700 hover:text-blue-800">
                        {hasAttendance ? 'View/Edit roll' : 'Take roll'}
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td className="p-4 text-neutral-700" colSpan={6}>No events.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        {msg && <p className="text-sm text-red-800">{msg}</p>}
      </div>
    </main>
  );
}
