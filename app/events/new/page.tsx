'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Team = { id: string; name: string };
type Freq = 'none' | 'daily' | 'weekly' | 'monthly';

function pad(n: number) { return String(n).padStart(2, '0'); }
function toDateInput(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function toTimeInput(d: Date) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function fromLocalDateTime(dateStr: string, timeStr: string) { return new Date(`${dateStr}T${timeStr}:00`); }
function addMinutes(d: Date, mins: number) { return new Date(d.getTime() + mins*60*1000); }

function addInterval(d: Date, freq: Freq, interval: number): Date {
  const x = new Date(d);
  if (freq === 'daily') x.setDate(x.getDate() + interval);
  else if (freq === 'weekly') x.setDate(x.getDate() + 7 * interval);
  else if (freq === 'monthly') x.setMonth(x.getMonth() + interval);
  return x;
}

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
  const [duration, setDuration] = useState(90);
  const [endDate, setEndDate] = useState(toDateInput(addMinutes(now, 90)));
  const [endTime, setEndTime] = useState('18:30');

  // recurrence
  const [freq, setFreq] = useState<Freq>('none');
  const [interval, setInterval] = useState(1);     // every N days/weeks/months
  const [count, setCount] = useState(6);           // total occurrences, including first
  const [untilDate, setUntilDate] = useState<string>(''); // optional end date
  const [msg, setMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      const { data } = await supabase.from('teams').select('id,name').order('name');
      setTeams(data ?? []);
    })();
  }, [router]);

  // auto end from duration
  useEffect(() => {
    const s = fromLocalDateTime(startDate, startTime);
    const e = addMinutes(s, duration);
    setEndDate(toDateInput(e));
    setEndTime(toTimeInput(e));
  }, [startDate, startTime, duration]);

  function occurrencesPreview(): Array<{starts: Date; ends: Date}> {
    const firstStart = fromLocalDateTime(startDate, startTime);
    const firstEnd   = fromLocalDateTime(endDate,   endTime);
    const list: Array<{starts: Date; ends: Date}> = [];
    const total = freq === 'none' ? 1 : Math.max(1, Math.min(count, 52));

    let s = new Date(firstStart);
    let e = new Date(firstEnd);
    for (let i = 0; i < total; i++) {
      if (untilDate) {
        const until = new Date(`${untilDate}T23:59:59`);
        if (s > until) break;
      }
      list.push({ starts: new Date(s), ends: new Date(e) });
      if (freq === 'none') break;
      s = addInterval(s, freq, interval);
      e = addInterval(e, freq, interval);
    }
    return list;
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const prev = occurrencesPreview();
    if (prev.length === 0) { setMsg('Error: no valid occurrences.'); return; }

    setSubmitting(true);

    const seriesId = (freq !== 'none' && 'crypto' in globalThis && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : null;

    const rows = prev.map(({starts, ends}) => ({
      series_id: seriesId,
      team_id: teamId || null,
      type,
      title: title || null,
      location: location || null,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
    }));

    const { error } = await supabase.from('events').insert(rows);
    setSubmitting(false);

    if (error) { setMsg(`Error: ${error.message}`); return; }
    router.replace('/dashboard');
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <div className="max-w-2xl mx-auto bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Create Event</h1>

        <form onSubmit={createEvent} className="space-y-5">
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

          {/* Start */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Start date
              <input type="date" required value={startDate}
                onChange={e=>setStartDate(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600"/>
            </label>
            <label className="block text-sm font-medium">
              Start time
              <input type="time" required value={startTime}
                onChange={e=>setStartTime(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600"/>
            </label>
          </div>

          {/* Duration presets */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium">Duration:</span>
            {[60,75,90,105,120].map(min => (
              <button key={min} type="button"
                onClick={()=>setDuration(min)}
                className={`px-3 py-1 rounded border ${duration===min ? 'bg-blue-700 text-white border-blue-700':'bg-white text-neutral-900 border-neutral-300'}`}>
                {min}m
              </button>
            ))}
          </div>

          {/* End */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              End date
              <input type="date" required value={endDate}
                onChange={e=>setEndDate(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600"/>
            </label>
            <label className="block text-sm font-medium">
              End time
              <input type="time" required value={endTime}
                onChange={e=>setEndTime(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-600"/>
            </label>
          </div>

          {/* Recurrence */}
          <div className="border border-neutral-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold">Repeat</label>
              <select value={freq} onChange={e=>setFreq(e.target.value as Freq)}
                className="border border-neutral-300 rounded-md px-3 py-2 bg-white">
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {freq !== 'none' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="block text-sm font-medium">
                    Every
                    <input type="number" min={1} value={interval}
                      onChange={e=>setInterval(Math.max(1, Number(e.target.value) || 1))}
                      className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"/>
                  </label>

                  <label className="block text-sm font-medium">
                    Count (max 52)
                    <input type="number" min={1} max={52} value={count}
                      onChange={e=>setCount(Math.min(52, Math.max(1, Number(e.target.value) || 1)))}
                      className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"/>
                  </label>

                  <label className="block text-sm font-medium">
                    Until (optional)
                    <input type="date" value={untilDate}
                      onChange={e=>setUntilDate(e.target.value)}
                      className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"/>
                  </label>
                </div>

                {/* Preview */}
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium">Preview first 5</summary>
                  <ul className="mt-2 list-disc pl-5 text-neutral-700">
                    {occurrencesPreview().slice(0,5).map((o,i)=>(
                      <li key={i}>
                        {o.starts.toLocaleString('en-NZ', {weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                        {' → '}
                        {o.ends.toLocaleString('en-NZ', {hour:'2-digit', minute:'2-digit'})}
                      </li>
                    ))}
                  </ul>
                </details>
              </>
            )}
          </div>

          <button type="submit" disabled={submitting}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-md px-3 py-2 font-semibold disabled:opacity-60">
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </form>

        {msg && <div className={`text-sm font-medium ${msg.startsWith('Error')?'text-red-800':'text-green-800'}`}>{msg}</div>}
      </div>
    </main>
  );
}
