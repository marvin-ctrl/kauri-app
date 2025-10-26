'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { getPlayerPhotoSignedUrl } from '@/lib/storage';
import LoadingState from '@/app/components/LoadingState';
import EmptyState from '@/app/components/EmptyState';
import {
 brandCard,
 brandContainer,
 brandHeading,
 brandPage,
 cx,
 primaryActionButton,
 secondaryActionButton,
 subtleText
} from '@/lib/theme';

type Player = {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  jersey_no: number | null;
  dob: string | null;
  photo_url: string | null;
  photo_storage_path: string | null;
};

export default function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<Player | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // simple guard for bad URLs
      const pid = String(id);
      const isUuid = /^[0-9a-f-]{36}$/i.test(pid);
      if (!isUuid) { setMsg('Invalid player id in URL.'); return; }

      const { data, error } = await supabase
        .from('players')
        .select('id, first_name, last_name, preferred_name, jersey_no, dob, photo_url, photo_storage_path')
        .eq('id', pid)
        .maybeSingle();
      if (error) setMsg(error.message);

      if (data) {
        setP(data as Player);

        // Load photo from storage if available
        if (data.photo_storage_path) {
          const signedUrl = await getPlayerPhotoSignedUrl(data.photo_storage_path);
          setPhotoUrl(signedUrl);
        } else if (data.photo_url) {
          // Fallback to old photo_url field
          setPhotoUrl(data.photo_url);
        }
      }
    })();
  }, [id]);

 if (msg && !p) {
   return (
     <main className={brandPage}>
       <div className={brandContainer}>
         <EmptyState icon="⚠️" title="Unable to load player" description={msg} action={<Link href="/players" className={secondaryActionButton}>Back to players</Link>} />
       </div>
     </main>
   );
 }

 if (!p) {
   return (
     <main className={brandPage}>
       <LoadingState message="Loading player…" />
     </main>
   );
 }

  const name = p.preferred_name || `${p.first_name} ${p.last_name}`;

  return (
   <main className={brandPage}>
     <div className={brandContainer}>
       <div className={cx(brandCard, 'mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 sm:p-8')}>
         <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
           <div className="space-y-1">
             <h1 className={cx(brandHeading, 'text-3xl sm:text-4xl')}>{name}</h1>
             <p className={cx('text-sm', subtleText)}>Player profile and registration details.</p>
           </div>
           <div className="flex flex-wrap gap-2">
             <Link href={`/players/${p.id}/assign`} className={primaryActionButton}>
               Assign to teams
             </Link>
             <Link href={`/players/${p.id}/edit`} className={secondaryActionButton}>
               Edit details
             </Link>
           </div>
         </header>

         <section className={cx(brandCard, 'border border-white/40 bg-white/75 p-6 shadow-inner shadow-white/40 sm:p-8')}>
           <div className="flex flex-col gap-6 sm:flex-row">
             {photoUrl && (
               <div className="flex-shrink-0">
                 <div className="relative h-32 w-32 overflow-hidden rounded-2xl border border-white/60 bg-white/40 shadow-inner shadow-[#172F56]/10 sm:h-40 sm:w-40">
                   <Image src={photoUrl} alt={`${name}'s photo`} fill className="object-cover" unoptimized />
                 </div>
                </div>
             )}

             <dl className="flex-1 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
               <div className="space-y-1">
                 <dt className={cx('text-xs font-semibold uppercase tracking-[0.3em]', subtleText)}>First name</dt>
                 <dd className="text-lg font-semibold text-[#172F56]">{p.first_name}</dd>
               </div>
               <div className="space-y-1">
                 <dt className={cx('text-xs font-semibold uppercase tracking-[0.3em]', subtleText)}>Last name</dt>
                 <dd className="text-lg font-semibold text-[#172F56]">{p.last_name}</dd>
               </div>
               <div className="space-y-1">
                 <dt className={cx('text-xs font-semibold uppercase tracking-[0.3em]', subtleText)}>Preferred name</dt>
                 <dd className="text-lg font-semibold text-[#172F56]">{p.preferred_name ?? '—'}</dd>
               </div>
               <div className="space-y-1">
                 <dt className={cx('text-xs font-semibold uppercase tracking-[0.3em]', subtleText)}>Jersey</dt>
                 <dd className="text-lg font-semibold text-[#172F56]">{p.jersey_no ?? '—'}</dd>
               </div>
               <div className="space-y-1 sm:col-span-2">
                 <dt className={cx('text-xs font-semibold uppercase tracking-[0.3em]', subtleText)}>Date of birth</dt>
                 <dd className="text-lg font-semibold text-[#172F56]">{p.dob ?? '—'}</dd>
               </div>
             </dl>
           </div>
         </section>

         <div className="flex justify-end">
           <Link href="/players" className={secondaryActionButton}>
             Back to players
           </Link>
         </div>
        </div>
      </div>
    </main>
  );
}
