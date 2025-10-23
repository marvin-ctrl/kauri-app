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
  const [endsAt, setEndsAt] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      const { data } = await supabase.from('teams').select('id,name').order('name');
      setTeams(data ?? []);
    })();
  }, [router]);

  function onStartChange(v: string) {
    setStartsAt(v);
    if (!endsAt) {
      const start = new Date(v);
      const end = new Date(start.getTime() + 90 * 60 * 1000);
      setEndsAt(end.toISOString().slice(0,16)); // yyyy-MM-ddTHH:mm
    }
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!startsAt || !endsAt) { setMsg('Error: start and end are required.'); return; }
    if (new Date(endsAt) <= new Date(startsAt)) { setMsg('Error: End must be after start.'); return; }

    const { error } = await supabase.from('events').insert({
      team_id: teamId || null,
      type,
      title: title || null,
      location: location || null,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
    });

    if (error) { setMsg(`Error: ${error.message}`); return; }
    router.replace('/dashboard');
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <div className="max-w-xl mx-auto bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-5">
        <h1 className="text-3xl font-extrabold tracking-tight">Create Event</h1>

        <form onSubmit={createEvent} className="space-y-4">
          <label className="block text-sm font-medium">
            Team
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Unassigned</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>

          <label className="block text-sm font-medium">
            Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="training">Training</option>
              <option value="game">Game</option>
              <option value="tournament">Tournament</option>
            </select>
          </label>

          <label className="block text-sm font-medium">
            Title (optional)
            <input
              className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={title} onChange={e=>setTitle(e.target.value)} placeholder="U12 Block 3"
            />
          </label>

          <label className="block text-sm font-medium">
            Location
            <input
              className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={location} onChange={e=>setLocation(e.target.value)} placeholder="Albany Stadium"
            />
          </label>

          <label className="block text-sm font-medium">
            Start
            <input
              type="datetime-local" required
              className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={startsAt} onChange={e=>onStartChange(e.target.value)}
            />
          </label>

          <label className="block text-sm font-medium">
            End
            <input
              type="datetime-local" required
              className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={endsAt} onChange={e=>setEndsAt(e.target.value)}
            />
          </label>

          <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-md px-3 py-2 font-semibold">
            Save
          </button>
        </form>

        {msg && (
          <div className={`text-sm font-medium ${msg.startsWith('Error') ? 'text-red-800' : 'text-green-800'}`}>
            {msg}
          </div>
        )}
      </div>
    </main>
  );
}
