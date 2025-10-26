'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import LoadingState from '@/app/components/LoadingState';
import EmptyState from '@/app/components/EmptyState';
import {
 brandCard,
 brandContainer,
 brandHeading,
 brandPage,
 brandTableCard,
 cx,
 primaryActionButton,
 subtleText
} from '@/lib/theme';

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

 if (loading) {
   return (
     <main className={brandPage}>
       <LoadingState message="Loading events…" />
     </main>
   );
 }

  return (
   <main className={brandPage}>
     <div className={brandContainer}>
       <header className={cx(brandCard, 'flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between')}>
         <div className="space-y-1">
           <h1 className={cx(brandHeading, 'text-3xl sm:text-4xl')}>Events</h1>
           <p className={cx('text-sm', subtleText)}>Manage match days, trainings, and key club happenings.</p>
         </div>
         <Link href="/events/new" className={primaryActionButton}>
            New event
          </Link>
        </header>

       {rows.length > 0 ? (
         <section className={cx(brandTableCard, 'overflow-hidden')}>
           <table className="w-full text-sm">
             <thead className="border-b border-white/40 bg-white/40 text-[#0f1f3b]">
               <tr>
                 <th className="text-left px-4 py-3">When</th>
                 <th className="text-left px-4 py-3">Type</th>
                 <th className="text-left px-4 py-3">Title</th>
                 <th className="text-left px-4 py-3">Location</th>
                 <th className="text-left px-4 py-3">Actions</th>
                </tr>
             </thead>
             <tbody>
               {rows.map(ev => (
                 <tr key={ev.id} className="border-b border-white/20 bg-white/60 text-[#0f1f3b] last:border-0">
                   <td className="px-4 py-3">
                     {new Date(ev.starts_at).toLocaleString('en-NZ', {
                       weekday: 'short',
                       month: 'short',
                       day: 'numeric',
                       hour: '2-digit',
                       minute: '2-digit'
                     })}
                   </td>
                   <td className="px-4 py-3 font-semibold uppercase tracking-wide text-[#172F56]">{ev.type}</td>
                   <td className="px-4 py-3">{ev.title ?? '—'}</td>
                   <td className="px-4 py-3">{ev.location ?? '—'}</td>
                   <td className="px-4 py-3">
                     <Link
                       href={`/events/${ev.id}/roll`}
                       className="font-semibold text-[#172F56] underline decoration-2 underline-offset-4 hover:text-[#0b1730]"
                     >
                       Take roll
                     </Link>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </section>
       ) : (
         <EmptyState
           icon="📅"
           title="No events scheduled"
           description="Keep the club informed by adding trainings, fixtures, or whānau events."
           action={<Link href="/events/new" className={primaryActionButton}>Schedule an event</Link>}
         />
       )}

       {msg && (
         <div className={cx(brandCard, 'border border-[#F289AE]/40 bg-[#F289AE]/20 p-4 text-sm text-[#742348]')}>{msg}</div>
       )}
      </div>
    </main>
  );
}
