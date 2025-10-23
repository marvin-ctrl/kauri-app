'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NewPlayerPage() {
  const router = useRouter();

  // player
  const [firstName, setFirst] = useState('');
  const [lastName, setLast] = useState('');
  const [preferred, setPreferred] = useState('');
  const [dob, setDob] = useState(''); // yyyy-mm-dd
  const [jersey, setJersey] = useState<number | ''>('');
  const [status, setStatus] = useState('active');

  // optional guardian (can skip)
  const [gName, setGName] = useState('');
  const [gEmail, setGEmail] = useState('');
  const [gPhone, setGPhone] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);

    const { data: p, error: pErr } = await supabase
      .from('players')
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        preferred_name: preferred.trim() || null,
        dob: dob || null,
        jersey_no: jersey === '' ? null : Number(jersey),
        status
      })
      .select('id')
      .single();

    if (pErr || !p) {
      setMsg(`Error: ${pErr?.message ?? 'Create failed'}`);
      setSaving(false);
      return;
    }

    if (gName.trim() || gEmail.trim() || gPhone.trim()) {
      const { data: g } = await supabase
        .from('guardians')
        .insert({
          name: gName.trim(),
          email: gEmail.trim() || null,
          phone: gPhone.trim() || null
        })
        .select('id')
        .single();

      if (g?.id) {
        await supabase.from('guardian_players').insert({
          player_id: p.id,
          guardian_id: g.id,
          primary_contact: true
        });
      }
    }

    setSaving(false);
    router.replace(`/players/${p.id}`);
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <div className="max-w-2xl mx-auto bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Add player</h1>
          <a
            href="/players"
            className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold"
          >
            Cancel
          </a>
        </header>

        <form onSubmit={save} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              First name
              <input
                required
                value={firstName}
                onChange={(e) => setFirst(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
              />
            </label>
            <label className="block text-sm font-medium">
              Last name
              <input
                required
                value={lastName}
                onChange={(e) => setLast(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block text-sm font-medium">
              Preferred name
              <input
                value={preferred}
                onChange={(e) => setPreferred(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
              />
            </label>
            <label className="block text-sm font-medium">
              Date of birth
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
              />
            </label>
            <label className="block text-sm font-medium">
              Jersey #
              <input
                type="number"
                min={0}
                value={jersey}
                onChange={(e) =>
                  setJersey(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
              />
            </label>
          </div>

          <label className="block text-sm font-medium">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
            >
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="alumni">Alumni</option>
            </select>
          </label>

          <fieldset className="border border-neutral-200 rounded-lg p-4">
            <legend className="text-sm font-bold px-1">Guardian (optional)</legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block text-sm font-medium">
                Name
                <input
                  value={gName}
                  onChange={(e) => setGName(e.target.value)}
                  className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
                />
              </label>
              <label className="block text-sm font-medium">
                Email
                <input
                  type="email"
                  value={gEmail}
                  onChange={(e) => setGEmail(e.target.value)}
                  className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
                />
              </label>
              <label className="block text-sm font-medium">
                Phone
                <input
                  value={gPhone}
                  onChange={(e) => setGPhone(e.target.value)}
                  className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
                />
              </label>
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-md px-3 py-2 font-semibold disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>

          {msg && (
            <div
              className={`text-sm font-medium ${
                msg.startsWith('Error') ? 'text-red-800' : 'text-green-800'
              }`}
            >
              {msg}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
