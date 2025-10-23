'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Team = { id: string; name: string };

function pad(n: number) { return String(n).padStart(2, '0'); }
function toDateInput(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function toTimeInput(d: Date) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function fromLocalDateTime(dateStr: string, timeStr: string) {
  // dateStr: yyyy-mm-dd, timeStr: HH:MM
  return new Date(`${dateStr}T${timeStr}:00`);
}
function addMinutes(d: Date, mins: number) { return new Date(d.getTime() + mins*60*1000); }

export default function NewEventPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState('');
  const [type, setType] = useState<'training'|'game'|'tournament'>('training');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');

  // start/end split inputs
  const now = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState(toDateInput(now));
  const [startTime, setStartTime] = useState('17:00');
  const [endDate, setEndDate] = useState(toDateInput(addMinutes(now, 90)));
  const [endTime, setEndTime] = useState('18:30');
  const [msg, setMsg] = useState<string | null>(null);
  const [duration, setDuration] = useState(90); // minutes

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      const { data } = await supabase.from('teams').select('id,name').order('name');
      setTeams(data ?? []);
    })();
  }, [router]);

  // when start or duration changes, auto-set end
  useEffect(() => {
    const s = fromLocalDateTime(startDate, startTime);
    const e = addMinutes(s, duration);
    setEndDate(toDateInput(e));
    setEndTime(toTimeInput(e));
  }, [startDate, startTime, duration]);

  // quick set helpers
  function setPreset(hour: number, minute = 0) {
    setStartTime(`${pad(hour)}:${pad(minute)}`);
  }
  function setNextDayPreset(hour: number, minute = 0) {
    const d = new Date(fromLocalDateTime(startDate, startTime));
    d.setDate(d.getDate() + 1);
    setStartDate(toDateInput(d));
    setStartTime(`${pad(hour)}:${pad(minute)}`);
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const starts = fromLocalDateTime(startDate, startTime);
    const ends = fromLocalDateTime(endDate, endTime);

    if (!(startDate && startTime && endDate && endTime)) {
      setMsg('Error: start and end are required.');
      return;
    }
    if (ends <= starts) {
      setMsg('Error: End must be after start.');
      return;
    }

    const { error } = await supabase.from('events').insert({
      team_id: teamId || null,
      type,
      title: title || null,
      location: location || null,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
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

          {/* Start pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Start date
              <input
                type="date" required value={startDate}
                onChange={e=>setStartDate(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </label>
            <label className="block text-sm font-medium">
              Start time
              <input
                type="time" required value={startTime}
                onChange={e=>setStartTime(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </label>
          </div>

          {/* Quick time presets */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium mr-1">Quick start:</span>
            <button type="button" className="btn btn-primary"
              onClick={()=>setPreset(16,0)}>Today 4:00p</button>
            <button type="button" className="btn btn-primary"
              onClick={()=>setPreset(17,0)}>Today 5:00p</button>
            <button type="button" className="btn btn-primary"
              onClick={()=>setPreset(18,0)}>Today 6:00p</button>
            <button type="button" className="btn"
              onClick={()=>setNextDayPreset(17,0)}>Tomorrow 5:00p</button>
          </div>

          {/* Duration presets */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium">Duration:</span>
            {[60, 75, 90, 105, 120].map(min => (
              <button
                key={min}
                type="button"
                onClick={()=>setDuration(min)}
                className={`px-3 py-1 rounded border ${
                  duration===min ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-neutral-900 border-neutral-300'
                }`}
              >
                {min}m
              </button>
            ))}
          </div>

          {/* End pickers (editable) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              End date
              <input
                type="date" required value={endDate}
                onChange={e=>setEndDate(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </label>
            <label className="block text-sm font-medium">
              End time
              <input
                type="time" required value={endTime}
                onChange={e=>setEndTime(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </label>
          </div>

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
