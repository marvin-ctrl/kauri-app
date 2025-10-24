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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#172F56] via-[#1e3a5f] to-[#79CBC4] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-[#79CBC4]">
          {/* Logo/Brand Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-[#172F56] mb-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
              KAURI FUTSAL
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-[#79CBC4] via-[#F289AE] to-[#79CBC4] mx-auto rounded-full"></div>
          </div>
          
          <p className="text-[#5a718f] text-center mb-6 font-medium">Sign in with your email</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block">
              <span className="block text-sm font-semibold text-[#172F56] mb-2">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#79CBC4] focus:ring-2 focus:ring-[#79CBC4]/20 transition-all"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#172F56] text-white py-3 rounded-lg font-bold hover:bg-[#1e3a5f] disabled:opacity-60 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? 'Sending…' : 'Send Magic Link'}
            </button>
          </form>

          {msg && (
            <div
              className={`mt-4 p-4 rounded-lg text-sm font-medium border-2 ${
                msg.startsWith('Error') 
                  ? 'bg-[#ffd7e4] text-[#c41d5e] border-[#F289AE]' 
                  : 'bg-[#d1f5f2] text-[#0d7a6e] border-[#79CBC4]'
              }`}
            >
              {msg}
            </div>
          )}
          
          {/* Decorative Footer */}
          <div className="mt-8 pt-6 border-t border-[#e2e8f0] text-center">
            <p className="text-xs text-[#5a718f]">Club Administration System</p>
          </div>
        </div>
      </div>
    </main>
  );
}
