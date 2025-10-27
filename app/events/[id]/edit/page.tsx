'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import LoadingState from '@/app/components/LoadingState';
import {
  brandCard,
  brandContainer,
  brandHeading,
  brandPage,
  cx,
  dangerActionButton,
  primaryActionButton,
  secondaryActionButton,
  subtleText
} from '@/lib/theme';

export const dynamic = 'force-dynamic';

type Team = { id: string; name: string };

function pad(n: number) { return String(n).padStart(2, '0'); }
function toDateInput(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function toTimeInput(d: Date) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }

export default function EditEventPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState('');
  const [type, setType] = useState<'training'|'game'|'tournament'>('training');
  const [title, setTitle] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(''); const [startTime, setStartTime] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');     const [endTime, setEndTime] = useState<string>('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: tData } = await supabase.from('teams').select('id,name').order('name');
      if (tData) setTeams(tData);

      const { data } = await supabase.from('events').select('*').eq('id', id).single();
      if (!data) { router.replace('/dashboard'); return; }
      setTeamId(data.team_id ?? '');
      setType(data.type ?? 'training');
      setTitle(data.title ?? '');
      setLocation(data.location ?? '');
      const s = new Date(data.starts_at);
      const e = new Date(data.ends_at);
      setStartDate(toDateInput(s)); setStartTime(toTimeInput(s));
      setEndDate(toDateInput(e));   setEndTime(toTimeInput(e));
      setLoading(false);
    })();
  }, [id, router]);

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

  if (loading) {
    return (
      <main className={brandPage}>
        <LoadingState message="Loading event…" />
      </main>
    );
  }

  return (
    <main className={brandPage}>
      <div className={brandContainer}>
        <div className={cx(brandCard, 'mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 sm:p-8')}>
          <header className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h1 className={cx(brandHeading, 'text-3xl sm:text-4xl')}>Edit event</h1>
                <p className={cx('text-sm', subtleText)}>Update details before players and whānau check in.</p>
              </div>
              <a href="/events" className={secondaryActionButton}>Back to events</a>
            </div>
          </header>

          <form onSubmit={save} className="space-y-5">
            <label className="block text-sm font-semibold text-[#172F56]">
              Team
              <select
                value={teamId}
                onChange={e => setTeamId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#172F56] shadow-inner focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/50"
              >
                <option value="">Unassigned</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-[#172F56]">
              Type
              <select
                value={type}
                onChange={e => setType(e.target.value as typeof type)}
                className="mt-2 w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#172F56] shadow-inner focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/50"
              >
                <option value="training">Training</option>
                <option value="game">Game</option>
                <option value="tournament">Tournament</option>
              </select>
            </label>

            <label className="block text-sm font-semibold text-[#172F56]">
              Title (optional)
              <input
                className="mt-2 w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#172F56] shadow-inner focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/50"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </label>

            <label className="block text-sm font-semibold text-[#172F56]">
              Location
              <input
                className="mt-2 w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#172F56] shadow-inner focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/50"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-[#172F56]">
                Start date
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#172F56] shadow-inner focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/50"
                />
              </label>
              <label className="block text-sm font-semibold text-[#172F56]">
                Start time
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#172F56] shadow-inner focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/50"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-[#172F56]">
                End date
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#172F56] shadow-inner focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/50"
                />
              </label>
              <label className="block text-sm font-semibold text-[#172F56]">
                End time
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#172F56] shadow-inner focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/50"
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button type="submit" className={cx(primaryActionButton, 'w-full sm:w-auto')}>
                Save changes
              </button>
              <button type="button" onClick={deleteEvent} className={cx(dangerActionButton, 'w-full sm:w-auto')}>
                Delete event
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
