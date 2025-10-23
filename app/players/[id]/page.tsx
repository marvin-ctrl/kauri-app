// app/players/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Player = {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  dob: string | null;
  jersey_no: number | null;
  status: string | null;
  notes: string | null;
  photo_url: string | null;
};

type Tp = { id: string; team_id: string; role: string };
type Team = { id: string; name: string };

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();

  const [player, setPlayer] = useState<Player | null>(null);
  const [memberships, setMemberships] = useState<Tp[]>([]);
  const [teamsById, setTeamsById] = useState<Map<string, Team>>(new Map());
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);

    // 1) player
    const p = await supabase.from('players').select('*').eq('id', id).maybeSingle();

    // 2) team_players rows (no join)
    const tp = await supabase
      .from('team_players')
      .select('id, team_id, role')
      .eq('player_id', id);

    // 3) fetch team names with IN()
    let map = new Map<string, Team>();
    if (tp.data && tp.data.length > 0) {
      const teamIds = Array.from(new Set(tp.data.map(r => r.team_id)));
      const t = await supabase.from('teams').select('id, name').in('id', teamIds);
      (t.data || []).forEach(team => map.set(team.id, team));
    }

    setPlayer(p.data || null);
    setMemberships(tp.data || []);
    setTeamsById(map);
  }

  useEffect(() => { (async () => { await load(); setLoading(false); })(); }, [id]);

  async function remove(teamPlayerId: string) {
    setMsg(null);
    const { error } = await supabase.from('team_players').delete().eq('id', teamPlayerId);
    if (error) { setMsg(`Error: ${error.message}`); return; }
    await load();
  }

  if (loading) return <main className="min-h-screen grid place-items-center">Loading…</main>;
  if (!player)   return <main className="min-h-screen grid place-items-center">Not found.</main>;

  const displayName = player.preferred_name || `${player.first_name} ${player.last_name}`;

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-neutral-200 overflow-hidden">
            {player.photo_url ? <img src={player.photo_url} alt={displayName} className="w-full h-full object-cover" /> : null}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold tracking-tight">{displayName}</h1>
            <p className="text-sm text-neutral-700">
              {player.status || 'active'} {player.jersey_no ? `• #${player.jersey_no}` : ''}
              {player.dob ? ` • DoB: ${new Date(player.dob).toLocaleDateString('en-NZ')}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <a href={`/players/${player.id}/assign`} className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold">Assign to teams</a>
            <a href={`/players/${player.id}/edit`} className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold">Edit</a>
          </div>
        </header>

        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-3">Teams</h2>
          {memberships.length === 0 ? (
            <p className="text-neutral-700">No teams. Use “Assign to teams”.</p>
          ) : (
            <ul className="space-y-2">
              {memberships.map(tp => {
                const team = teamsById.get(tp.team_id);
                return (
                  <li key={tp.id} className="flex items-center justify-between border border-neutral-200 rounded-md p-3">
                    <div className="text-sm">
                      <span className="font-semibold">{team?.name || 'Team'}</span>
                      {tp.role !== 'player' ? <span className="ml-2 text-neutral-700">• {tp.role}</span> : null}
                    </div>
                    <button onClick={() => remove(tp.id)} className="px-2 py-1 rounded bg-red-700 hover:bg-red-800 text-white text-sm">
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {msg && <p className="mt-3 text-sm text-red-800">{msg}</p>}
        </section>

        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-3">Notes</h2>
          <p className="text-sm text-neutral-800 whitespace-pre-wrap">{player.notes || '—'}</p>
        </section>
      </div>
    </main>
  );
}
