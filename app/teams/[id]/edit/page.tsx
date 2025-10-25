'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Team = { id: string; name: string };

export default function EditTeamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [row, setRow] = useState<Team | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('teams').select('id,name').eq('id', id).maybeSingle();
      if (error || !data) { setMsg(error ? `Error: ${error.message}` : 'Not found'); setLoading(false); return; }
      setRow(data);
      setName(data.name);
      setLoading(false);
    })();
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setMsg('Name is required'); return; }
    setMsg(null);
    setSaving(true);
    const { error } = await supabase.from('teams').update({ name: name.trim() }).eq('id', id);
    setSaving(false);
    if (error) { setMsg(`Error: ${error.message}`); return; }
    router.replace('/teams');
  }

  async function del() {
    if (!confirm('Delete this team? Related memberships and team-term shells will be removed.')) return;
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) { setMsg(`Error: ${error.message}`); return; }
    router.replace('/teams');
  }

  if (loading) return <main className="min-h-screen grid place-items-center">Loading…</main>;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-md mx-auto bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-5">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Edit team</h1>
          <a href="/teams" className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-black font-semibold">Back</a>
        </header>

        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm font-medium">
            Team name
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-black"
              required
            />
          </label>

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-md px-3 py-2 font-semibold disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={del} className="px-3 py-2 rounded-md bg-red-700 hover:bg-red-800 text-white font-semibold">
              Delete
            </button>
          </div>

          {msg && <div className="text-sm text-red-800">{msg}</div>}
        </form>
      </div>
    </main>
  );
}
