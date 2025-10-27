'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { getPlayerPhotoSignedUrl } from '@/lib/storage';

type Player = {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  jersey_no: number | null;
  dob: string | null;
  photo_url: string | null;
  photo_storage_path: string | null;
};

type PaymentInfo = {
  id: string;
  teamName: string;
  amountDue: number;
  amountPaid: number;
  paid: boolean;
};

export default function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<Player | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [payments, setPayments] = useState<PaymentInfo[]>([]);

  useEffect(() => {
    (async () => {
      // simple guard for bad URLs
      const pid = String(id);
      const isUuid = /^[0-9a-f-]{36}$/i.test(pid);
      if (!isUuid) { setMsg('Invalid player id in URL.'); return; }

      const { data, error } = await supabase
        .from('players')
        .select('id, first_name, last_name, preferred_name, jersey_no, dob, photo_url, photo_storage_path')
        .eq('id', pid)
        .maybeSingle();
      if (error) setMsg(error.message);

      if (data) {
        setP(data as Player);

        // Load photo from storage if available
        if (data.photo_storage_path) {
          const signedUrl = await getPlayerPhotoSignedUrl(data.photo_storage_path);
          setPhotoUrl(signedUrl);
        } else if (data.photo_url) {
          // Fallback to old photo_url field
          setPhotoUrl(data.photo_url);
        }

        // Load payment info
        const termId = localStorage.getItem('kauri.termId');
        if (termId) {
          // Get player_term_id for current term
          const { data: playerTermData } = await supabase
            .from('player_terms')
            .select('id')
            .eq('player_id', pid)
            .eq('term_id', termId)
            .maybeSingle();

          if (playerTermData) {
            // Get all payments for this player in current term
            const { data: paymentData } = await supabase
              .from('player_payments')
              .select(`
                id,
                amount_due,
                amount_paid,
                paid,
                team_terms!inner(teams!inner(name))
              `)
              .eq('player_term_id', playerTermData.id);

            if (paymentData) {
              setPayments(paymentData.map((p: any) => ({
                id: p.id,
                teamName: p.team_terms.teams.name,
                amountDue: p.amount_due,
                amountPaid: p.amount_paid,
                paid: p.paid
              })));
            }
          }
        }
      }
    })();
  }, [id]);

  if (msg && !p) return <main className="min-h-screen grid place-items-center">{msg}</main>;
  if (!p) return <main className="min-h-screen grid place-items-center">Loading…</main>;

  const name = p.preferred_name || `${p.first_name} ${p.last_name}`;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">{name}</h1>
          <div className="flex gap-2">
            {/* REAL links using p.id */}
            <Link href={`/players/${p.id}/assign`} className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold">
              Assign to teams
            </Link>
            <Link href={`/players/${p.id}/edit`} className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold">
              Edit
            </Link>
          </div>
        </header>

        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Player Photo */}
            {photoUrl && (
              <div className="flex-shrink-0">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-lg overflow-hidden border-2 border-neutral-300 bg-neutral-100">
                  <Image
                    src={photoUrl}
                    alt={`${name}'s photo`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
            )}

            {/* Player Details */}
            <dl className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-neutral-600">First name</dt>
                <dd className="font-semibold">{p.first_name}</dd>
              </div>
              <div>
                <dt className="text-neutral-600">Last name</dt>
                <dd className="font-semibold">{p.last_name}</dd>
              </div>
              <div>
                <dt className="text-neutral-600">Preferred name</dt>
                <dd className="font-semibold">{p.preferred_name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-neutral-600">Jersey</dt>
                <dd className="font-semibold">{p.jersey_no ?? '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-neutral-600">Date of birth</dt>
                <dd className="font-semibold">{p.dob ?? '—'}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Payments Section */}
        {payments.length > 0 && (
          <section className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Payments (NZD)</h2>
              <Link href="/payments" className="text-sm underline text-blue-700 hover:text-blue-800">
                View all payments
              </Link>
            </div>

            <div className="space-y-3">
              {payments.map(payment => {
                const balance = payment.amountDue - payment.amountPaid;
                return (
                  <div key={payment.id} className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0">
                    <div>
                      <p className="font-semibold">{payment.teamName}</p>
                      <p className="text-sm text-neutral-600">
                        ${payment.amountPaid.toFixed(2)} of ${payment.amountDue.toFixed(2)} paid
                      </p>
                    </div>
                    <div className="text-right">
                      {payment.paid ? (
                        <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                          Paid
                        </span>
                      ) : (
                        <div>
                          <span className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 mb-1">
                            Unpaid
                          </span>
                          <p className="text-sm font-semibold text-red-600">
                            ${balance.toFixed(2)} due
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Total Due:</span>
                <span className="font-bold">${payments.reduce((sum, p) => sum + p.amountDue, 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Total Paid:</span>
                <span className="font-bold text-green-600">${payments.reduce((sum, p) => sum + p.amountPaid, 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="font-semibold">Balance:</span>
                <span className="font-bold text-red-600">
                  ${payments.reduce((sum, p) => sum + (p.amountDue - p.amountPaid), 0).toFixed(2)}
                </span>
              </div>
            </div>
          </section>
        )}

        <div>
          <Link href="/players" className="underline text-blue-700 hover:text-blue-800">Back to players</Link>
        </div>
      </div>
    </main>
  );
}
