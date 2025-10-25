'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useCallback } from 'react';
import TermSwitcher from './TermSwitcher';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/' && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={[
        'px-3 py-2 rounded-md text-sm font-bold transition-all outline-none border-2',
        active
          ? 'bg-black text-white shadow-sm border-black'
          : 'bg-white text-black hover:bg-neutral-100 border-black',
        'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black focus-visible:ring-offset-white'
      ].join(' ')}
    >
      {label}
    </Link>
  );
}

export default function Nav() {
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }, []);

  return (
    <nav className="w-full border-b-4 border-black bg-white shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-3 gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-xl font-extrabold tracking-tight text-black hover:text-neutral-600 transition-colors"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            KAURI FUTSAL
          </Link>
          <div className="flex items-center gap-2">
            <NavLink href="/dashboard" label="Dashboard" />
            <NavLink href="/events" label="Events" />
            <NavLink href="/players" label="Players" />
            <NavLink href="/teams" label="Teams" />
            <NavLink href="/terms" label="Terms" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TermSwitcher />
          <button
            onClick={signOut}
            className="px-3 py-2 rounded-md text-sm font-bold bg-red-700 text-white hover:bg-red-800 transition-all shadow-sm border-2 border-black"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
