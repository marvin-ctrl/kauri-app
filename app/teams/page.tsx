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
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Team = { id: string; name: string };

export default function TeamsPage() {
  const [rows, setRows] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('teams')
      .select('id,name')
      .order('name', { ascending: true });
    if (error) setMsg(error.message);
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function removeTeam(id: string) {
    setMsg(null);
    if (!confirm('Delete this team? Related memberships and team-term shells will be removed.')) return;
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) { setMsg(`Error: ${error.message}`); return; }
    await load();
  }

 if (loading) {
   return (
     <main className={brandPage}>
       <LoadingState message="Loading teams…" />
     </main>
   );
 }

  return (
   <main className={brandPage}>
     <div className={brandContainer}>
       <header className={cx(brandCard, 'flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between')}>
         <div className="space-y-1">
           <h1 className={cx(brandHeading, 'text-3xl sm:text-4xl')}>Teams</h1>
           <p className={cx('text-sm', subtleText)}>Organise squads, assign coaches, and keep rosters tidy.</p>
         </div>
         <Link href="/teams/new" className={primaryActionButton}>
            New team
          </Link>
        </header>

       {rows.length > 0 ? (
         <section className={cx(brandTableCard, 'overflow-hidden')}>
           <table className="w-full text-sm">
             <thead className="border-b border-white/40 bg-white/40 text-[#0f1f3b]">
               <tr>
                 <th className="text-left px-4 py-3">Name</th>
                 <th className="text-left px-4 py-3">Actions</th>
                </tr>
             </thead>
             <tbody>
               {rows.map(t => (
                 <tr key={t.id} className="border-b border-white/20 bg-white/60 text-[#0f1f3b] last:border-0">
                   <td className="px-4 py-3 font-semibold text-[#172F56]">{t.name}</td>
                   <td className="px-4 py-3">
                     <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#172F56]">
                       <Link href={`/teams/${t.id}/roster`} className="underline decoration-2 underline-offset-4 hover:text-[#0b1730]">
                         Roster
                       </Link>
                       <span className="text-white/40">•</span>
                       <Link href={`/teams/${t.id}/assign`} className="underline decoration-2 underline-offset-4 hover:text-[#0b1730]">
                         Assign
                       </Link>
                       <span className="text-white/40">•</span>
                       <button
                         onClick={() => removeTeam(t.id)}
                         className="text-[#c41d5e] underline decoration-2 underline-offset-4 transition hover:text-[#9b1549]"
                       >
                         Delete
                       </button>
                     </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </section>
       ) : (
         <EmptyState
           icon="👥"
           title="No teams yet"
           description="Create a team to group players and build season rosters."
           action={<Link href="/teams/new" className={primaryActionButton}>Create a team</Link>}
         />
       )}

       {msg && (
         <div className={cx(brandCard, 'border border-[#F289AE]/40 bg-[#F289AE]/20 p-4 text-sm text-[#742348]')}>{msg}</div>
       )}
      </div>
    </main>
  );
}
