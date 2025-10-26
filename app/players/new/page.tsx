'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '@/app/components/ToastProvider';
import {
  brandCard,
  brandContainer,
  brandHeading,
  brandPage,
  cx,
  primaryActionButton,
  secondaryActionButton,
  subtleText
} from '@/lib/theme';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type FieldError = {
  firstName?: string;
  lastName?: string;
  dob?: string;
  jersey?: string;
  guardianEmail?: string;
};

export default function NewPlayerPage() {
  const router = useRouter();
  const toast = useToast();
  const [firstName, setFirst] = useState('');
  const [lastName, setLast] = useState('');
  const [preferred, setPreferred] = useState('');
  const [dob, setDob] = useState('');
  const [jersey, setJersey] = useState<number | ''>('');
  const [status, setStatus] = useState('active');
  const [guardianName, setGName] = useState('');
  const [guardianEmail, setGEmail] = useState('');
  const [guardianPhone, setGPhone] = useState('');
  const [errors, setErrors] = useState<FieldError>({});
  const [saving, setSaving] = useState(false);

  function validateForm(): boolean {
    const newErrors: FieldError = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (dob) {
      const dobDate = new Date(dob);
      const today = new Date();
      if (dobDate > today) {
        newErrors.dob = 'Date of birth cannot be in the future';
      }
    }

    if (jersey !== '' && (jersey < 0 || jersey > 999)) {
      newErrors.jersey = 'Jersey number must be between 0 and 999';
    }

    if (guardianEmail.trim() && !isValidEmail(guardianEmail.trim())) {
      newErrors.guardianEmail = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setSaving(true);
    const { data: pData, error: pErr } = await supabase
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

    if (pErr || !pData) {
      toast.error(`Failed to create player: ${pErr?.message}`);
      setSaving(false);
      return;
    }

    if (guardianName.trim() || guardianEmail.trim() || guardianPhone.trim()) {
      const { data: g } = await supabase
        .from('guardians')
        .insert({
          name: guardianName.trim(),
          email: guardianEmail.trim() || null,
          phone: guardianPhone.trim() || null
        })
        .select('id')
        .single();
      if (g) {
        await supabase
          .from('guardian_players')
          .insert({ player_id: pData.id, guardian_id: g.id, primary_contact: true });
      }
    }

    setSaving(false);
    toast.success('Player created successfully!');
    router.replace(`/players/${pData.id}`);
  }

  const inputClass = (hasError?: string) =>
    cx(
      'mt-2 w-full rounded-xl border bg-white/80 px-4 py-3 text-sm text-[#172F56] shadow-inner transition-all',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      hasError
        ? 'border-[#F289AE] focus:border-[#F289AE] focus:ring-[#F289AE]/50'
        : 'border-white/60 focus:border-[#79CBC4] focus:ring-[#79CBC4]/50'
    );

  const labelClass = 'block text-sm font-semibold text-[#172F56]';
  const helperClass = cx('mt-1 text-xs', subtleText);
  const errorClass = 'mt-1 text-xs text-[#c41d5e] font-medium';

  return (
    <main className={brandPage}>
      <div className={brandContainer}>
        <div className={cx(brandCard, 'mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 sm:p-8')}>
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className={cx(brandHeading, 'text-3xl sm:text-4xl')}>Add player</h1>
              <p className={cx('text-sm', subtleText)}>Create a new player profile for your club.</p>
            </div>
            <a href="/players" className={secondaryActionButton}>
              Cancel
            </a>
          </header>

          <form onSubmit={save} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                First name <span className="text-[#F289AE]">*</span>
                <input
                  value={firstName}
                  onChange={e => {
                    setFirst(e.target.value);
                    if (errors.firstName) setErrors({ ...errors, firstName: undefined });
                  }}
                  className={inputClass(errors.firstName)}
                  placeholder="e.g., Emma"
                />
                {!errors.firstName && <p className={helperClass}>Player's legal first name</p>}
                {errors.firstName && <p className={errorClass}>{errors.firstName}</p>}
              </label>
              <label className={labelClass}>
                Last name <span className="text-[#F289AE]">*</span>
                <input
                  value={lastName}
                  onChange={e => {
                    setLast(e.target.value);
                    if (errors.lastName) setErrors({ ...errors, lastName: undefined });
                  }}
                  className={inputClass(errors.lastName)}
                  placeholder="e.g., Johnson"
                />
                {!errors.lastName && <p className={helperClass}>Player's legal last name</p>}
                {errors.lastName && <p className={errorClass}>{errors.lastName}</p>}
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className={labelClass}>
                Preferred name
                <input
                  value={preferred}
                  onChange={e => setPreferred(e.target.value)}
                  className={inputClass()}
                  placeholder="e.g., Em"
                />
                <p className={helperClass}>Optional nickname</p>
              </label>
              <label className={labelClass}>
                Date of birth
                <input
                  type="date"
                  value={dob}
                  onChange={e => {
                    setDob(e.target.value);
                    if (errors.dob) setErrors({ ...errors, dob: undefined });
                  }}
                  className={inputClass(errors.dob)}
                />
                {!errors.dob && <p className={helperClass}>For age grouping</p>}
                {errors.dob && <p className={errorClass}>{errors.dob}</p>}
              </label>
              <label className={labelClass}>
                Jersey #
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={jersey}
                  onChange={e => {
                    setJersey(e.target.value === '' ? '' : Number(e.target.value));
                    if (errors.jersey) setErrors({ ...errors, jersey: undefined });
                  }}
                  className={inputClass(errors.jersey)}
                  placeholder="e.g., 10"
                />
                {!errors.jersey && <p className={helperClass}>0-999</p>}
                {errors.jersey && <p className={errorClass}>{errors.jersey}</p>}
              </label>
            </div>

            <label className={labelClass}>
              Status
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className={inputClass()}
              >
                <option value="prospect">Prospect</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="alumni">Alumni</option>
              </select>
              <p className={helperClass}>Current player status in the club</p>
            </label>

            <fieldset className="space-y-4 rounded-2xl border border-white/40 bg-white/30 p-5">
              <legend className="px-2 text-sm font-bold text-[#172F56]">Guardian (optional)</legend>
              <p className={cx('text-xs', subtleText)}>
                Add emergency contact or parent/guardian information
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className={labelClass}>
                  Name
                  <input
                    value={guardianName}
                    onChange={e => setGName(e.target.value)}
                    className={inputClass()}
                    placeholder="e.g., Jane Johnson"
                  />
                </label>
                <label className={labelClass}>
                  Email
                  <input
                    type="email"
                    value={guardianEmail}
                    onChange={e => {
                      setGEmail(e.target.value);
                      if (errors.guardianEmail) setErrors({ ...errors, guardianEmail: undefined });
                    }}
                    className={inputClass(errors.guardianEmail)}
                    placeholder="e.g., jane@example.com"
                  />
                  {errors.guardianEmail && <p className={errorClass}>{errors.guardianEmail}</p>}
                </label>
                <label className={labelClass}>
                  Phone
                  <input
                    type="tel"
                    value={guardianPhone}
                    onChange={e => setGPhone(e.target.value)}
                    className={inputClass()}
                    placeholder="e.g., 021 123 4567"
                  />
                </label>
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={saving}
              className={cx(primaryActionButton, 'w-full justify-center disabled:opacity-60')}
            >
              {saving ? 'Creating player...' : 'Create player'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
