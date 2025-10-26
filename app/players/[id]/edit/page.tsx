'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { uploadAndSavePlayerPhoto, getPlayerPhotoSignedUrl } from '@/lib/storage';
import PhotoUpload from '@/app/components/PhotoUpload';
import LoadingState from '@/app/components/LoadingState';
import ConfirmationModal from '@/app/components/ConfirmationModal';
import { useToast } from '@/app/components/ToastProvider';
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
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        toast.error(error ? `Error: ${error.message}` : 'Player not found.');
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
    })();
  }, [id, toast]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
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
        const errorMsg = uploadResult.error || 'Failed to upload photo';
        setUploadError(errorMsg);
        toast.error(errorMsg);
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
    if (error) {
      toast.error(`Error: ${error.message}`);
      return;
    }
    toast.success('Player updated successfully!');
    router.replace(`/players/${id}`);
  }

  async function handleDelete() {
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) {
      toast.error(`Error: ${error.message}`);
      return;
    }
    toast.success('Player deleted successfully');
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
              <button type="button" onClick={() => setShowDeleteModal(true)} className={dangerActionButton}>
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
          </form>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete player?"
        message="This action cannot be undone. All player data, including assignments and history, will be permanently removed."
        confirmLabel="Delete player"
        variant="danger"
      />
    </main>
  );
}
