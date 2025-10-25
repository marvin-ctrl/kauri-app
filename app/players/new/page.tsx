'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NewPlayerPage() {
  const router = useRouter();
  const [firstName, setFirst] = useState(''); const [lastName, setLast] = useState('');
  const [preferred, setPreferred] = useState(''); const [dob, setDob] = useState('');
  const [jersey, setJersey] = useState<number | ''>(''); const [status, setStatus] = useState('active');
  const [photoUrl, setPhotoUrl] = useState('');
  const [guardianName, setGName] = useState(''); const [guardianEmail, setGEmail] = useState(''); const [guardianPhone, setGPhone] = useState('');
  const [msg, setMsg] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(null); setSaving(true);
    const { data: pData, error: pErr } = await supabase
      .from('players')
      .insert({
        first_name: firstName.trim(), last_name: lastName.trim(),
        preferred_name: preferred.trim() || null,
        dob: dob || null, jersey_no: jersey === '' ? null : Number(jersey),
        status,
        photo_url: photoUrl.trim() || null
      })
      .select('id')
      .single();
    if (pErr || !pData) { setMsg(`Error: ${pErr?.message}`); setSaving(false); return; }

    if (guardianName.trim() || guardianEmail.trim() || guardianPhone.trim()) {
      const { data: g } = await supabase.from('guardians')
        .insert({ name: guardianName.trim(), email: guardianEmail.trim() || null, phone: guardianPhone.trim() || null })
        .select('id').single();
      if (g) {
        await supabase.from('guardian_players')
          .insert({ player_id: pData.id, guardian_id: g.id, primary_contact: true });
      }
    }

    setSaving(false);
    router.replace(`/players/${pData.id}`);
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <div className="max-w-2xl mx-auto bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Add player</h1>
          <a href="/players" className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold text-sm">
            Cancel
          </a>
        </header>

        <form onSubmit={save} className="space-y-5">
          {/* Quick Entry Section */}
          <div className="space-y-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <h2 className="text-lg font-bold text-blue-900">Quick Entry</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-sm font-medium">
                First name <span className="text-red-600">*</span>
                <input className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white" required
                  value={firstName} onChange={e=>setFirst(e.target.value)} autoFocus />
              </label>
              <label className="block text-sm font-medium">
                Last name <span className="text-red-600">*</span>
                <input className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white" required
                  value={lastName} onChange={e=>setLast(e.target.value)} />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-sm font-medium">
                Jersey #
                <input type="number" min={0} className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
                  value={jersey} onChange={e=>setJersey(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Optional" />
              </label>
              <label className="block text-sm font-medium">
                Preferred name
                <input className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
                  value={preferred} onChange={e=>setPreferred(e.target.value)}
                  placeholder="Optional" />
              </label>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-3 py-2 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold text-sm flex items-center justify-center gap-2"
          >
            {showAdvanced ? '▼' : '▶'} {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>

          {/* Advanced Section */}
          {showAdvanced && (
            <div className="space-y-4 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-sm font-medium">
                  Date of birth
                  <input type="date" className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
                    value={dob} onChange={e=>setDob(e.target.value)} />
                </label>
                <label className="block text-sm font-medium">
                  Status
                  <select className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
                    value={status} onChange={e=>setStatus(e.target.value)}>
                    <option value="prospect">Prospect</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="alumni">Alumni</option>
                  </select>
                </label>
              </div>

              <label className="block text-sm font-medium">
                Photo URL
                <input className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
                  value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)}
                  placeholder="https://…" />
              </label>

              <fieldset className="border border-neutral-200 rounded-lg p-4">
                <legend className="text-sm font-bold px-1">Guardian</legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="block text-sm font-medium">
                    Name
                    <input className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
                      value={guardianName} onChange={e=>setGName(e.target.value)} />
                  </label>
                  <label className="block text-sm font-medium">
                    Email
                    <input type="email" className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
                      value={guardianEmail} onChange={e=>setGEmail(e.target.value)} />
                  </label>
                  <label className="block text-sm font-medium">
                    Phone
                    <input className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
                      value={guardianPhone} onChange={e=>setGPhone(e.target.value)} />
                  </label>
                </div>
              </fieldset>
            </div>
          )}

          <button type="submit" disabled={saving}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-md px-3 py-2 font-semibold disabled:opacity-60 text-lg">
            {saving ? 'Saving…' : 'Save Player'}
          </button>
          {msg && <div className="text-sm text-red-800 font-medium">{msg}</div>}
        </form>
      </div>
    </main>
  );
}
