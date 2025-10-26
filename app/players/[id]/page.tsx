'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { getPlayerPhotoSignedUrl } from '@/lib/storage';

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

  if (msg && !p) return <main className="min-h-screen grid place-items-center">{msg}</main>;
  if (!p) return <main className="min-h-screen grid place-items-center">Loading…</main>;

  const name = p.preferred_name || `${p.first_name} ${p.last_name}`;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">{name}</h1>
          <div className="flex gap-2">
            {/* REAL links using p.id */}
            <Link href={`/players/${p.id}/assign`} className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold">
              Assign to teams
            </Link>
            <Link href={`/players/${p.id}/edit`} className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold">
              Edit
            </Link>
          </div>
        </header>

        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Player Photo */}
            {photoUrl && (
              <div className="flex-shrink-0">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-lg overflow-hidden border-2 border-neutral-300 bg-neutral-100">
                  <Image
                    src={photoUrl}
                    alt={`${name}'s photo`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
            )}

            {/* Player Details */}
            <dl className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-neutral-600">First name</dt>
                <dd className="font-semibold">{p.first_name}</dd>
              </div>
              <div>
                <dt className="text-neutral-600">Last name</dt>
                <dd className="font-semibold">{p.last_name}</dd>
              </div>
              <div>
                <dt className="text-neutral-600">Preferred name</dt>
                <dd className="font-semibold">{p.preferred_name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-neutral-600">Jersey</dt>
                <dd className="font-semibold">{p.jersey_no ?? '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-neutral-600">Date of birth</dt>
                <dd className="font-semibold">{p.dob ?? '—'}</dd>
              </div>
            </dl>
          </div>
        </section>

        <div>
          <Link href="/players" className="underline text-blue-700 hover:text-blue-800">Back to players</Link>
        </div>
      </div>
    </main>
  );
}
