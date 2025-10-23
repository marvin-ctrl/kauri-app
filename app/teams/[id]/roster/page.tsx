'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Team = { id: string; name: string };
type Tp = { id: string; player_id: string; role: string | null };
type Player = {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  jersey_no: number | null;
};

export default function TeamRosterPage() {
  const { id: teamId } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [rows, setRows] = useState<Array<{ tp: Tp; player: Player | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);

    // 1) team
    const t = await supabase.from('teams').select('id,name').eq('id', teamId).maybeSingle();

    // 2) memberships (no join)
    const tp = await supabase
      .from('team_players')
      .select('id, player_id, role')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });

    // 3) fetch players with IN()
    let map = new Map<string, Player>();
    if (tp.data && tp.data.length > 0) {
      const ids = Array.from(new Set(tp.data.map(r => r.player_id)));
      const players = await supabase
        .from('players')
        .select('id, first_name, last_name, preferred_name, jersey_no')
        .in('id', ids);
      (players.data || []).forEach(p => map.set(p.id, p));
    }

    setTeam(t.data || null);
    setRows((tp.data || []).map(r => ({ tp: r, player: map.get(r.player_id) || null })));
  }

  useEffect(() => { (async () => { await load(); setLoading(false); })(); }, [teamId]);

  async function remove(teamPlayerId: string) {
    setMsg(null);
    const { error } = await supabase.from('team_players').delete().eq('id', teamPlayerId);
    if (error) { setMsg(`Error: ${error.message}`); return; }
    await load();
  }

  if (loading) return <main className="min-h-screen grid place-items-center">Loading…</main>;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{team?.name || 'Team'}</h1>
            <p className="text-sm text-neutral-700">Roster</p>
          </div>
          <a href="/teams" className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold">
            Back to Teams
          </a>
        </header>

        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          {rows.length === 0 ? (
            <p className="text-neutral-700">No players on this team.</p>
          ) : (
            <ul className="space-y-2">
              {rows.map(({ tp, player }) => {
                const name = player?.preferred_name || `${player?.first_name || ''} ${player?.last_name || ''}`.trim();
                return (
                  <li key={tp.id} className="flex items-center justify-between border border-neutral-200 rounded-md p-3">
                    <div className="text-sm">
                      <span className="font-semibold">{name || 'Player'}</span>
                      {player?.jersey_no != null && <span className="ml-2 text-neutral-700">#{player.jersey_no}</span>}
                      {tp.role && tp.role !== 'player' && <span className="ml-2 text-neutral-700">• {tp.role}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {player?.id && (
                        <a href={`/players/${player.id}`} className="text-sm underline text-blue-700 hover:text-blue-800">Profile</a>
                      )}
                      <button onClick={() => remove(tp.id)} className="px-2 py-1 rounded bg-red-700 hover:bg-red-800 text-white text-xs">
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {msg && <p className="mt-3 text-sm text-red-800">{msg}</p>}
        </section>
      </div>
    </main>
  );
}
