'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/lib/supabase';
import { useAuthGuard } from '@/lib/auth-guard';
import { uploadAndSavePlayerPhoto, getPlayerPhotoSignedUrl } from '@/lib/storage';
import { formatError } from '@/lib/validation';
import PhotoUpload from '@/app/components/PhotoUpload';

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
  const { isLoading: authLoading, isAuthenticated } = useAuthGuard();
  const supabase = useSupabase();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // form fields
  const [firstName, setFirst] = useState('');
  const [lastName, setLast] = useState('');
  const [preferred, setPreferred] = useState('');
  const [dob, setDob] = useState(''); // yyyy-mm-dd
  const [jersey, setJersey] = useState<number | ''>('');
  const [status, setStatus] = useState('active');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // photo upload state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoStoragePath, setPhotoStoragePath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setMsg('Player not found.');
        setLoading(false);
        return;
      }

      const p = data as Player;
      setFirst(p.first_name || '');
      setLast(p.last_name || '');
      setPreferred(p.preferred_name || '');
      setDob(p.dob || '');
      setJersey(p.jersey_no ?? '');
      setStatus(p.status || 'active');
      setNotes(p.notes || '');
      setPhotoUrl(p.photo_url || '');
      setPhotoStoragePath(p.photo_storage_path || null);

      // Load photo from storage if available
      if (p.photo_storage_path) {
        const signedUrl = await getPlayerPhotoSignedUrl(p.photo_storage_path);
        setCurrentPhotoUrl(signedUrl);
      } else if (p.photo_url) {
        // Fallback to old photo_url field
        setCurrentPhotoUrl(p.photo_url);
      }

      setLoading(false);
    } catch (err: unknown) {
      setMsg(`Error: ${formatError(err)}`);
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    setUploadError(null);

    // Handle photo upload if a new file was selected
    if (photoFile) {
      setUploading(true);
      const uploadResult = await uploadAndSavePlayerPhoto(
        id,
        photoFile,
        photoStoragePath
      );
      setUploading(false);

      if (!uploadResult.success) {
        setUploadError(uploadResult.error || 'Failed to upload photo');
        setSaving(false);
        return;
      }

      // Update storage path after successful upload
      setPhotoStoragePath(uploadResult.path || null);
    }

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

    const { error } = await supabase.from('players').update(payload).eq('id', id);
    setSaving(false);
    if (error) { setMsg(`Error: ${error.message}`); return; }
    router.replace(`/players/${id}`);
  }

  async function del() {
    if (!confirm('Delete this player? This cannot be undone.')) return;
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) { setMsg(`Error: ${error.message}`); return; }
    router.replace('/players');
  }

  if (loading) {
    return <main className="min-h-screen grid place-items-center bg-neutral-50 text-neutral-900">Loading…</main>;
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <div className="max-w-2xl mx-auto bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Edit player</h1>
          <div className="flex gap-2">
            <a
              href={`/players/${id}`}
              className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold"
            >
              Cancel
            </a>
            <button
              onClick={del}
              className="px-3 py-2 rounded-md bg-red-700 hover:bg-red-800 text-white font-semibold"
              type="button"
            >
              Delete
            </button>
          </div>
        </header>

        <form onSubmit={save} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              First name
              <input
                required
                value={firstName}
                onChange={e=>setFirst(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
              />
            </label>
            <label className="block text-sm font-medium">
              Last name
              <input
                required
                value={lastName}
                onChange={e=>setLast(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block text-sm font-medium">
              Preferred name
              <input
                value={preferred}
                onChange={e=>setPreferred(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
              />
            </label>
            <label className="block text-sm font-medium">
              Date of birth
              <input
                type="date"
                value={dob}
                onChange={e=>setDob(e.target.value)}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
              />
            </label>
            <label className="block text-sm font-medium">
              Jersey #
              <input
                type="number"
                min={0}
                value={jersey}
                onChange={e=>setJersey(e.target.value === '' ? '' : Number(e.target.value))}
                className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
              />
            </label>
          </div>

          <label className="block text-sm font-medium">
            Status
            <select
              value={status}
              onChange={e=>setStatus(e.target.value)}
              className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
            >
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="alumni">Alumni</option>
            </select>
          </label>

          <PhotoUpload
            currentPhotoUrl={currentPhotoUrl}
            onPhotoSelected={(file) => {
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

          <label className="block text-sm font-medium">
            Notes
            <textarea
              rows={5}
              value={notes}
              onChange={e=>setNotes(e.target.value)}
              className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 bg-white"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-md px-3 py-2 font-semibold disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>

          {msg && (
            <div className={`text-sm font-medium ${msg.startsWith('Error') ? 'text-red-800' : 'text-green-800'}`}>
              {msg}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
