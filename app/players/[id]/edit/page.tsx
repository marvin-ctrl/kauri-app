'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { uploadAndSavePlayerPhoto, getPlayerPhotoSignedUrl } from '@/lib/storage';
import PhotoUpload from '@/app/components/PhotoUpload';
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

type Player = {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  dob: string | null;               // yyyy-mm-dd
  jersey_no: number | null;
  status: string | null;            // prospect|active|inactive|alumni
  notes: string | null;
  photo_url: string | null;
  photo_storage_path: string | null;
  photo_updated_at: string | null;
};

export default function EditPlayerPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // form fields
  const [firstName, setFirst] = useState('');
  const [lastName, setLast] = useState('');
  const [preferred, setPreferred] = useState('');
  const [dob, setDob] = useState('');
  const [jersey, setJersey] = useState<number | ''>('');
  const [status, setStatus] = useState('prospect');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Photo-upload fields
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await getSupabaseClient()
        .from('players')
        .select('id,first_name,last_name,preferred_name,dob,jersey_no,status,notes,photo_url,photo_storage_path,photo_updated_at')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) { setMsg('Not found'); setLoading(false); return; }
      const r = data as Player;
      setFirst(r.first_name);
      setLast(r.last_name);
      setPreferred(r.preferred_name ?? '');
      setDob(r.dob ?? '');
      setJersey(r.jersey_no ?? '');
      setStatus(r.status ?? 'prospect');
      setNotes(r.notes ?? '');
      setPhotoUrl(r.photo_url ?? '');

      // Load current photo if available
      if (r.photo_storage_path) {
        const signedUrl = await getPlayerPhotoSignedUrl(r.photo_storage_path);
        setCurrentPhotoUrl(signedUrl);
      } else if (r.photo_url) {
        setCurrentPhotoUrl(r.photo_url);
      }

      setLoading(false);
    })();
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    // Upload photo if selected
    if (photoFile) {
      setUploading(true);
      setUploadError(null);
      const uploadResult = await uploadAndSavePlayerPhoto(id, photoFile);
      setUploading(false);
      if (!uploadResult.success) {
        setUploadError(uploadResult.error || 'Upload failed');
        return;
      }
      // If upload succeeded, the photo_storage_path & photo_updated_at are set, proceed
    }

    setSaving(true);

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      preferred_name: preferred.trim() || null,
      dob: dob || null,
      jersey_no: jersey === '' ? null : Number(jersey),
      status,
      notes: notes.trim() || null,
      photo_url: photoUrl.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await getSupabaseClient().from('players').update(payload).eq('id', id);
    setSaving(false);
    if (error) { setMsg(`Error: ${error.message}`); return; }
    router.replace(`/players/${id}`);
  }

  async function del() {
    if (!confirm('Delete this player? This cannot be undone.')) return;
    const { error } = await getSupabaseClient().from('players').delete().eq('id', id);
    if (error) { setMsg(`Error: ${error.message}`); return; }
    router.replace('/players');
  }

  if (loading) {
    return (
      <main className={brandPage}>
        <LoadingState message="Loading player…" />
      </main>
    );
  }

  return (
    <main className={brandPage}>
      <div className={brandContainer}>
        <div className={cx(brandCard, 'mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 sm:p-8')}>
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className={cx(brandHeading, 'text-3xl sm:text-4xl')}>Edit player</h1>
              <p className={cx('text-sm', subtleText)}>Update roster details, jersey numbers, and player status.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`/players/${id}`} className={secondaryActionButton}>
                Cancel
              </a>
              <button type="button" onClick={del} className={dangerActionButton}>
                Delete
              </button>
            </div>
          </header>

          <form onSubmit={save} className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-[#172F56]">
                First name
                <input
                  required
                  value={firstName}
                  onChange={e => setFirst(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#172F56] shadow-inner focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/50"
                />
              </label>
              <label className="block text-sm font-semibold text-[#172F56]">
                Last name
                <input
                  required
                  value={lastName}
                  onChange={e => setLast(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#172F56] shadow-inner focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/50"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="block text-sm font-semibold text-[#172F56]">
                Preferred name
                <input
                  value={preferred}
                  onChange={e => setPreferred(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#172F56] shadow-inner focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/50"
                />
              </label>
              <label className="block text-sm font-semibold text-[#172F56]">
                Date of birth
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#172F56] shadow-inner focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/50"
                />
              </label>
              <label className="block text-sm font-semibold text-[#172F56]">
                Jersey #
                <input
                  type="number"
                  min={0}
                  value={jersey}
                  onChange={e => setJersey(e.target.value === '' ? '' : Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#172F56] shadow-inner focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/50"
                />
              </label>
            </div>

            <label className="block text-sm font-semibold text-[#172F56]">
              Status
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#172F56] shadow-inner focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/50"
              >
                <option value="prospect">Prospect</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="alumni">Alumni</option>
              </select>
            </label>

            <div className="rounded-2xl border border-white/40 bg-white/70 p-4 shadow-inner shadow-white/40">
              <PhotoUpload
                currentPhotoUrl={currentPhotoUrl}
                onPhotoSelected={file => {
                  setPhotoFile(file);
                  setUploadError(null);
                }}
                onPhotoRemove={() => {
                  setPhotoFile(null);
                  setCurrentPhotoUrl(null);
                  setUploadError(null);
                }}
                uploading={uploading}
                error={uploadError}
              />
            </div>

            <label className="block text-sm font-semibold text-[#172F56]">
              Notes
              <textarea
                rows={5}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-[#172F56] shadow-inner focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/50"
              />
            </label>

            <button type="submit" disabled={saving} className={cx(primaryActionButton, 'w-full justify-center disabled:opacity-60')}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>

            {msg && (
              <div
                className={cx(
                  'rounded-2xl border px-4 py-3 text-sm font-medium',
                  msg.startsWith('Error')
                    ? 'border-[#F289AE]/40 bg-[#F289AE]/25 text-[#742348]'
                    : 'border-[#79CBC4]/40 bg-[#79CBC4]/20 text-[#0f3a37]'
                )}
              >
                {msg}
              </div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
