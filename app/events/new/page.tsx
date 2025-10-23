'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Team = { id: string; name: string };

export default function NewEventPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState('');
  const [type, setType] = useState<'training'|'game'|'tournament'>('training');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      const { data } = await supabase.from('teams').select('id,name').order('name');
      setTeams(data ?? []);
    })();
  }, [router]);

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const { error } = await supabase.from('events').insert({
      team_id: teamId || null,
      type,
      title: title || null,
      location: location || null,
      starts_at: new Date(startsAt).toISOString(),
    });
    if (error) { setMsg(`Error: ${error.message}`); return; }
    router.replace('/dashboard');
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold">Create Event</h1>

        <form onSubmit={createEvent} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Team</span>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Unassigned</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="training">Training</option>
              <option value="game">Game</option>
              <option value="tournament">Tournament</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Title (optional)</span>
            <input className="w-full border rounded px-3 py-2"
              value={title} onChange={e=>setTitle(e.target.value)} placeholder="U12 Block 3" />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Location</span>
            <input className="w-full border rounded px-3 py-2"
              value={location} onChange={e=>setLocation(e.target.value)} placeholder="Albany Stadium" />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Start</span>
            <input type="datetime-local" required
              className="w-full border rounded px-3 py-2"
              value={startsAt} onChange={e=>setStartsAt(e.target.value)} />
          </label>

          <button type="submit" className="w-full bg-blue-600 text-white rounded px-3 py-2">
            Save
          </button>
        </form>

        {msg && <div className={`text-sm ${msg.startsWith('Error')?'text-red-600':'text-green-700'}`}>{msg}</div>}
      </div>
    </main>
  );
}
