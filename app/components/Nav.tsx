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
      className={`px-3 py-2 rounded-md text-sm font-semibold ${
        active ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300'
      }`}
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
    <nav className="w-full border-b border-neutral-200 bg-white">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-3 gap-3">
        {/* left: brand + links */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-lg font-extrabold tracking-tight text-neutral-900">
            Kauri
          </Link>
          <div className="flex items-center gap-2">
            <NavLink href="/dashboard" label="Dashboard" />
            <NavLink href="/events" label="Events" />
            <NavLink href="/players" label="Players" />
            <NavLink href="/teams" label="Teams" />
            <NavLink href="/terms" label="Terms" />
          </div>
        </div>

        {/* right: term switcher + sign out */}
        <div className="flex items-center gap-2">
          <TermSwitcher />
          <button
            onClick={signOut}
            className="px-3 py-2 rounded-md text-sm font-semibold bg-neutral-900 text-white hover:bg-black"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
