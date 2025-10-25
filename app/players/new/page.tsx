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
  const [guardianName, setGName] = useState(''); const [guardianEmail, setGEmail] = useState(''); const [guardianPhone, setGPhone] = useState('');
  const [msg, setMsg] = useState<string | null>(null); const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(null); setSaving(true);
    const { data: pData, error: pErr } = await supabase
      .from('players')
      .insert({
        first_name: firstName.trim(), last_name: lastName.trim(),
        preferred_name: preferred.trim() || null,
        dob: dob || null, jersey_no: jersey === '' ? null : Number(jersey),
        status
      })
      .select('id')
      .single();
    if (pErr || !pData) { setMsg(`Error: ${pErr?.message}`); setSaving(false); return; }

    if (guardianName.trim() || guardianEmail.trim() || guardianPhone.trim()) {
      const { data: g, error: gErr } = await supabase.from('guardians')
        .insert({ name: guardianName.trim(), email: guardianEmail.trim() || null, phone: guardianPhone.trim() || null })
        .select('id').single();
      if (gErr || !g) {
        setMsg(`Error creating guardian: ${gErr?.message || 'Unknown error'}`);
        setSaving(false);
        return;
      }
      const { error: gpErr } = await supabase.from('guardian_players')
        .insert({ player_id: pData.id, guardian_id: g.id, primary_contact: true });
      if (gpErr) {
        setMsg(`Error linking guardian: ${gpErr.message}`);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    router.replace(`/players/${pData.id}`);
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <div className="max-w-2xl mx-auto bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Add player</h1>

        <form onSubmit={save} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              First name
              <input className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900" required
                value={firstName} onChange={e=>setFirst(e.target.value)} />
            </label>
            <label className="block text-sm font-medium">
              Last name
              <input className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900" required
                value={lastName} onChange={e=>setLast(e.target.value)} />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block text-sm font-medium">
              Preferred name
              <input className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900"
                value={preferred} onChange={e=>setPreferred(e.target.value)} />
            </label>
            <label className="block text-sm font-medium">
              Date of birth
              <input type="date" className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900"
                value={dob} onChange={e=>setDob(e.target.value)} />
            </label>
            <label className="block text-sm font-medium">
              Jersey #
              <input type="number" min={1} className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900"
                value={jersey} onChange={e=>setJersey(e.target.value === '' ? '' : Number(e.target.value))} />
            </label>
          </div>

          <label className="block text-sm font-medium">
            Status
            <select className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900"
              value={status} onChange={e=>setStatus(e.target.value)}>
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
                <input className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900"
                  value={guardianName} onChange={e=>setGName(e.target.value)} />
              </label>
              <label className="block text-sm font-medium">
                Email
                <input type="email" className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900"
                  value={guardianEmail} onChange={e=>setGEmail(e.target.value)} />
              </label>
              <label className="block text-sm font-medium">
                Phone
                <input className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900"
                  value={guardianPhone} onChange={e=>setGPhone(e.target.value)} />
              </label>
            </div>
          </fieldset>

          <button type="submit" disabled={saving}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-md px-3 py-2 font-semibold disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
          {msg && <div className="text-sm text-red-800">{msg}</div>}
        </form>
      </div>
    </main>
  );
}
