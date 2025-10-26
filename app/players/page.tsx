'use client';

import { useEffect, useState } from 'react';
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
  created_at: string | null;
  photo_url: string | null;
  photo_storage_path: string | null;
};

type PlayerWithPhotoUrl = Player & {
  signedPhotoUrl?: string | null;
};

export default function PlayersPage() {
  const [rows, setRows] = useState<PlayerWithPhotoUrl[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    const { data, error } = await supabase
      .from('players')
      .select('id, first_name, last_name, preferred_name, jersey_no, created_at, photo_url, photo_storage_path')
      .order('created_at', { ascending: false });

    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }

    // Load signed URLs for all players with photos
    const playersWithPhotos: PlayerWithPhotoUrl[] = await Promise.all(
      (data || []).map(async (player) => {
        let signedPhotoUrl: string | null = null;

        if (player.photo_storage_path) {
          signedPhotoUrl = await getPlayerPhotoSignedUrl(player.photo_storage_path);
        } else if (player.photo_url) {
          signedPhotoUrl = player.photo_url;
        }

        return {
          ...player,
          signedPhotoUrl,
        };
      })
    );

    setRows(playersWithPhotos);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = rows.filter(p => {
    const term = q.trim().toLowerCase();
    if (!term) return true;
    const name = `${p.first_name} ${p.last_name} ${p.preferred_name || ''}`.toLowerCase();
    return name.includes(term) || String(p.jersey_no ?? '').includes(term);
  });

  if (loading) return <main className="min-h-screen grid place-items-center">Loading…</main>;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Players</h1>
          <Link href="/players/new" className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold">
            New player
          </Link>
        </header>

        <div className="flex gap-3">
          <input
            value={q}
            onChange={e=>setQ(e.target.value)}
            placeholder="Search by name or jersey…"
            className="border border-neutral-300 rounded-md px-3 py-2 bg-white"
          />
        </div>

        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 border-b border-neutral-200">
              <tr>
                <th className="text-left p-3">Photo</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Jersey</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const name = p.preferred_name || `${p.first_name} ${p.last_name}`;
                return (
                  <tr key={p.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="p-3">
                      {p.signedPhotoUrl ? (
                        <div className="relative w-12 h-12 rounded-md overflow-hidden border border-neutral-300 bg-neutral-100">
                          <Image
                            src={p.signedPhotoUrl}
                            alt={`${name}'s photo`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-md border border-neutral-300 bg-neutral-100 flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-neutral-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="p-3">{name}</td>
                    <td className="p-3">{p.jersey_no ?? '—'}</td>
                    <td className="p-3">
                      {/* REAL links using p.id */}
                      <Link href={`/players/${p.id}`} className="underline text-blue-700 hover:text-blue-800">View</Link>
                      <span className="mx-2 text-neutral-300">|</span>
                      <Link href={`/players/${p.id}/assign`} className="underline text-blue-700 hover:text-blue-800">Assign to teams</Link>
                      <span className="mx-2 text-neutral-300">|</span>
                      <Link href={`/players/${p.id}/edit`} className="underline text-blue-700 hover:text-blue-800">Edit</Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td className="p-4 text-neutral-700" colSpan={4}>No players.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        {msg && <p className="text-sm text-red-800">{msg}</p>}
      </div>
    </main>
  );
}
