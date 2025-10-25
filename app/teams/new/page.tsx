'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NewTeamPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const trimmed = name.trim();
    if (!trimmed) { setMsg('Team name is required.'); return; }

    setSaving(true);
    const { data, error } = await supabase
      .from('teams')
      .insert({ name: trimmed })
      .select('id')
      .single();

    setSaving(false);

    if (error || !data) {
      // surface exact reason
      const details = error?.details || error?.message || 'Create failed';
      // friendly mapping for common cases
      if (details.includes('unique')) setMsg('That team name already exists.');
      else if (details.includes('permission') || details.includes('RLS')) setMsg('Permission denied. Check RLS policy on teams.');
      else setMsg(`Error: ${details}`);
      return;
    }

    // go assign players for this team
    router.replace(`/teams/${data.id}/assign`);
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-md mx-auto bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-5">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">New team</h1>
          <a href="/teams" className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold">Cancel</a>
        </header>

        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm font-medium">
            Team name
            <input
              required
              value={name}
              onChange={e=>setName(e.target.value)}
              className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900"
              placeholder="U12 Tigers, Seniors, etc."
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-md px-3 py-2 font-semibold disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save team'}
          </button>

          {msg && <div className="text-sm text-red-800">{msg}</div>}
        </form>
      </div>
    </main>
  );
}
