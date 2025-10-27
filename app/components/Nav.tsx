// app/components/Nav.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import TermSwitcher from './TermSwitcher';
import { useSupabase } from '@/lib/supabase';
import { cx } from '@/lib/theme';

const LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/events', label: 'Events' },
  { href: '/players', label: 'Players' },
  { href: '/teams', label: 'Teams' },
  { href: '/terms', label: 'Terms' },
];

function NavLink({
  href,
  label,
  pathname,
  onNavigate,
  className,
}: {
  href: string;
  label: string;
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  const active = pathname === href || (href !== '/' && pathname.startsWith(href));
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cx(
        'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#79CBC4] focus-visible:ring-offset-transparent',
        active
          ? 'bg-white text-[#172F56] shadow-[0_12px_30px_-20px_rgba(23,47,86,0.6)]'
          : 'border border-white/30 bg-white/10 text-white hover:bg-white/20',
        className
      )}
    >
      {label}
    </Link>
  );
}

export default function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useSupabase();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/login');
  }, [router, supabase]);

  return (
    <nav className="brand-nav sticky top-0 z-40 border-b border-white/20 bg-gradient-to-r from-[#0d1b35] to-[#172F56]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center gap-4">
          <Link
            href="/dashboard"
            className="text-xl font-extrabold uppercase tracking-[0.3em] text-white transition-colors hover:text-[#79CBC4] font-brand"
          >
            KAURI FUTSAL
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {LINKS.map((link) => (
              <NavLink key={link.href} pathname={pathname} {...link} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TermSwitcher />

          <button
            onClick={signOut}
            className="inline-flex items-center justify-center rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[#172F56] shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F289AE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1b35]"
          >
            Sign out
          </button>

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-label="Toggle navigation"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#79CBC4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1b35] md:hidden"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 pb-4 md:hidden">
          {LINKS.map((link) => (
            <NavLink
              key={link.href}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
              className="w-full"
              {...link}
            />
          ))}
        </div>
      )}
    </nav>
  );
}

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="m5 5 10 10M5 15 15 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
