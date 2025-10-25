'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import TermSwitcher from './TermSwitcher';
import { useSupabase } from '@/lib/supabase';

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
  const router = useRouter();
  const supabase = useSupabase();

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/login');
  }, [router, supabase]);

  return (
    <nav className="w-full border-b border-[#e2e8f0] bg-white shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-3 gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-xl font-extrabold tracking-tight text-[#172F56] hover:text-[#79CBC4] transition-colors"
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
            className="px-3 py-2 rounded-md text-sm font-semibold bg-[#F289AE] text-[#172F56] hover:bg-[#e5679a] transition-all shadow-sm"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
