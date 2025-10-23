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
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Kauri Futsal</h1>
          <p className="text-gray-600 text-center mb-6">Sign in with your email</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send Magic Link'}
            </button>
          </form>

          {msg && (
            <div
              className={`mt-4 p-3 rounded-md text-sm ${
                msg.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
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
