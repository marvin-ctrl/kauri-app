'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type Team = { id: string; name: string };

export default function NewEventPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'training'|'game'|'tournament'>('training');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [scope, setScope] = useState<'term'|'team'>('team'); // default to team-specific
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('teams').select('id,name').order('name');
      if (error) setMsg(error.message);
      setTeams(data || []);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!startsAt) { setMsg('Start time is required.'); return; }
    const termId = localStorage.getItem('kauri.termId');
    if (!termId) { setMsg('Select a term in the header.'); return; }

    setSaving(true);
    try {
      let teamTermId: string | null = null;

      if (scope === 'team') {
        if (!teamId) { setMsg('Choose a team.'); setSaving(false); return; }
        // ensure team_terms row for this team+term
        const tt = await supabase
          .from('team_terms')
          .select('id').eq('team_id', teamId).eq('term_id', termId).maybeSingle();

        if (tt.data?.id) teamTermId = tt.data.id;
        else {
          const ins = await supabase
            .from('team_terms')
            .insert({ team_id: teamId, term_id: termId })
            .select('id').single();
          if (ins.error || !ins.data) throw new Error(ins.error?.message || 'Failed to create team-term');
          teamTermId = ins.data.id;
        }
      }

      const payload: any = {
        title: title.trim() || null,
        type, location: location.trim() || null,
        starts_at: startsAt,
        ends_at: endsAt || null,
        team_term_id: teamTermId, // null = whole-term event
      };

      const { data, error } = await supabase.from('events').insert(payload).select('id').single();
      if (error || !data) throw new Error(error?.message || 'Create failed');

      router.replace(`/events/${data.id}/roll`);
    } catch (err: any) {
      setMsg(`Error: ${err.message || 'Save failed'}`);
      setSaving(false);
      return;
    }
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-xl mx-auto bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-5">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">New event</h1>
          <a href="/events" className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300">Cancel</a>
        </header>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm font-medium">Title
            <input value={title} onChange={e=>setTitle(e.target.value)} className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"/>
          </label>

          <label className="block text-sm font-medium">Type
            <select value={type} onChange={e=>setType(e.target.value as any)} className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white">
              <option value="training">training</option>
              <option value="game">game</option>
              <option value="tournament">tournament</option>
            </select>
          </label>

          <label className="block text-sm font-medium">Location
            <input value={location} onChange={e=>setLocation(e.target.value)} className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"/>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm font-medium">Starts at
              <input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white" required/>
            </label>
            <label className="block text-sm font-medium">Ends at
              <input type="datetime-local" value={endsAt} onChange={e=>setEndsAt(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"/>
            </label>
          </div>

          <fieldset className="border border-neutral-200 rounded-lg p-4">
            <legend className="text-sm font-bold px-1">Scope</legend>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2">
                <input type="radio" name="scope" value="team" checked={scope==='team'} onChange={()=>setScope('team')}/>
                <span className="text-sm">Specific team</span>
              </label>
              {scope==='team' && (
                <select value={teamId} onChange={e=>setTeamId(e.target.value)}
                        className="w-full border border-neutral-300 rounded-md px-3 py-2 bg-white">
                  <option value="">Select team…</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
              <label className="flex items-center gap-2">
                <input type="radio" name="scope" value="term" checked={scope==='term'} onChange={()=>setScope('term')}/>
                <span className="text-sm">Whole term (all registered players)</span>
              </label>
            </div>
          </fieldset>

          <button type="submit" disabled={saving}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-md px-3 py-2 font-semibold disabled:opacity-60">
            {saving ? 'Saving…' : 'Create event'}
          </button>

          {msg && <p className={`text-sm ${msg.startsWith('Error')?'text-red-800':'text-green-800'}`}>{msg}</p>}
        </form>
      </div>
    </main>
  );
}
