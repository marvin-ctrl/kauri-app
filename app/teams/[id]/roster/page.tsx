'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Row = {
  id: string; // team_players.id
  player_id: string;
  role: string;
  players: { first_name: string; last_name: string; preferred_name: string | null; jersey_no: number | null } | null;
};
type Team = { id: string; name: string };

export default function TeamRosterPage() {
  const { id: teamId } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    const t = await supabase.from('teams').select('id,name').eq('id', teamId).maybeSingle();
    const tp = await supabase
      .from('team_players')
      .select('id, player_id, role, players(first_name,last_name,preferred_name,jersey_no)')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });

    setTeam(t.data || null);
    setRows((tp.data as any) || []);
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
          <a href="/teams" className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold">Back to Teams</a>
        </header>

        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          {rows.length === 0 ? (
            <p className="text-neutral-700">No players on this team.</p>
          ) : (
            <ul className="space-y-2">
              {rows.map(r => {
                const p = r.players;
                const name = p?.preferred_name || `${p?.first_name || ''} ${p?.last_name || ''}`.trim();
                return (
                  <li key={r.id} className="flex items-center justify-between border border-neutral-200 rounded-md p-3">
                    <div className="text-sm">
                      <span className="font-semibold">{name || 'Player'}</span>
                      {p?.jersey_no != null && <span className="ml-2 text-neutral-700">#{p.jersey_no}</span>}
                      {r.role && r.role !== 'player' && <span className="ml-2 text-neutral-700">• {r.role}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={`/players/${r.player_id}`} className="text-sm underline text-blue-700 hover:text-blue-800">Profile</a>
                      <button onClick={() => remove(r.id)} className="px-2 py-1 rounded bg-red-700 hover:bg-red-800 text-white text-xs">
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
