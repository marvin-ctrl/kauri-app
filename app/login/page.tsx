'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/post-auth` },
    });

    if (error) setMsg(`Error: ${error.message}`);
    else setMsg('Check your email for the magic link.');
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Kauri Futsal</h1>
          <p className="text-neutral-700 mb-6">Sign in with your email.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <label htmlFor="email" className="block text-sm font-medium text-neutral-900">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white text-neutral-900"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-md font-semibold disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send Magic Link'}
            </button>
          </form>

          {msg && (
            <div
              className={`mt-4 p-3 rounded-md text-sm font-medium ${
                msg.startsWith('Error')
                  ? 'bg-red-100 text-red-900 border border-red-300'
                  : 'bg-green-100 text-green-900 border border-green-300'
              }`}
            >
              {msg}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
