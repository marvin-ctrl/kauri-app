'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/supabase';
import { useAuthGuard } from '@/lib/auth-guard';
import { isValidUUID } from '@/lib/validation';

type Team = { id: string; name: string };

function pad(n: number) { return String(n).padStart(2, '0'); }
function toDateInput(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function toTimeInput(d: Date) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }

export default function EditEventPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuthGuard();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const supabase = useSupabase();

  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState('');
  const [type, setType] = useState<'training'|'game'|'tournament'>('training');
  const [title, setTitle] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(''); const [startTime, setStartTime] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');     const [endTime, setEndTime] = useState<string>('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!isValidUUID(id)) {
      setMsg('Invalid event ID');
      setLoading(false);
      return;
    }

    const [teamsRes, eventRes] = await Promise.all([
      supabase.from('teams').select('id,name').order('name'),
      supabase.from('events').select('*').eq('id', id).maybeSingle(),
    ]);
    setTeams(teamsRes.data ?? []);

    const ev = eventRes.data;
    if (!ev) { setMsg('Event not found.'); setLoading(false); return; }

    setTeamId(ev.team_id ?? '');
    setType(ev.type);
    setTitle(ev.title ?? '');
    setLocation(ev.location ?? '');
    const s = new Date(ev.starts_at); const e = new Date(ev.ends_at);
    setStartDate(toDateInput(s)); setStartTime(toTimeInput(s));
    setEndDate(toDateInput(e));   setEndTime(toTimeInput(e));
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    const starts_at = new Date(`${startDate}T${startTime}:00`).toISOString();
    const ends_at   = new Date(`${endDate}T${endTime}:00`).toISOString();
    const { error } = await supabase.from('events').update({
      team_id: teamId || null,
      type, title: title || null, location: location || null, starts_at, ends_at
    }).eq('id', id);
    if (error) { setMsg(`Error: ${error.message}`); return; }
    router.replace('/dashboard');
  }

  async function deleteEvent() {
    if (!confirm('Delete this event?')) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) { setMsg(`Error: ${error.message}`); return; }
    router.replace('/dashboard');
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="h-12 bg-neutral-200 rounded animate-pulse" />
          <div className="h-64 bg-neutral-200 rounded animate-pulse" />
        </div>
      </main>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <div className="max-w-2xl mx-auto bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-5">
        <h1 className="text-3xl font-extrabold tracking-tight">Edit Event</h1>

        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm font-medium">
            Team
            <select value={teamId} onChange={(e)=>setTeamId(e.target.value)}
              className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white">
              <option value="">No specific team</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium">
            Type
            <select value={type} onChange={(e)=>setType(e.target.value as any)}
              className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white">
              <option value="training">Training</option>
              <option value="game">Game</option>
              <option value="tournament">Tournament</option>
            </select>
          </label>

          <label className="block text-sm font-medium">
            Title (optional)
            <input className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
              value={title} onChange={e=>setTitle(e.target.value)} />
          </label>

          <label className="block text-sm font-medium">
            Location
            <input className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
              value={location} onChange={e=>setLocation(e.target.value)} />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Start date
              <input type="date" required value={startDate}
                onChange={e=>setStartDate(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"/>
            </label>
            <label className="block text-sm font-medium">
              Start time
              <input type="time" required value={startTime}
                onChange={e=>setStartTime(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"/>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              End date
              <input type="date" required value={endDate}
                onChange={e=>setEndDate(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"/>
            </label>
            <label className="block text-sm font-medium">
              End time
              <input type="time" required value={endTime}
                onChange={e=>setEndTime(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"/>
            </label>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold">Save</button>
            <button type="button" onClick={deleteEvent} className="px-3 py-2 rounded-md bg-red-700 hover:bg-red-800 text-white font-semibold">Delete</button>
          </div>
        </form>
      </div>
    </main>
  );
}
