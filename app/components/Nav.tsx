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
        'px-3 py-2 rounded-md text-sm font-semibold transition-all outline-none',
        active
          ? 'bg-[#172F56] text-white shadow-sm'                  // dark chip → white text OK
          : 'bg-white text-[#172F56] hover:bg-[#79CBC4] border border-[#e2e8f0]', // light/teal bg → dark text
        'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#79CBC4] focus-visible:ring-offset-white'
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
    <nav className="w-full border-b border-[#e2e8f0] bg-white shadow-sm">
      <div className="max-w-6xl mx-auto p-3">
        {/* Mobile & Desktop Layout */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Brand & Main Nav */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/dashboard"
              className="text-lg sm:text-xl font-extrabold tracking-tight text-[#172F56] hover:text-[#79CBC4] transition-colors text-center sm:text-left"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              KAURI FUTSAL
            </Link>
            {/* Nav Links - Wrap on mobile */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <NavLink href="/dashboard" label="Dashboard" />
              <NavLink href="/events" label="Events" />
              <NavLink href="/players" label="Players" />
              <NavLink href="/teams" label="Teams" />
              <NavLink href="/terms" label="Terms" />
            </div>
          </div>
          {/* Right Side - Term Switcher & Sign Out */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
            <TermSwitcher />
            <button
              onClick={signOut}
              className="px-3 py-2 rounded-md text-sm font-semibold bg-[#F289AE] text-[#172F56] hover:bg-[#e5679a] transition-all shadow-sm whitespace-nowrap"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
