import './globals.css';
import Link from 'next/link';

export const metadata = { title: 'Kauri Futsal', description: 'Club admin' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-extrabold text-lg tracking-tight">Kauri Futsal</Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              <Link href="/events" className="hover:underline">Events</Link>
              <Link href="/teams" className="hover:underline">Teams</Link>
              <Link href="/players" className="hover:underline">Players</Link>
              <Link href="/terms" className="hover:underline">Terms</Link>
            </nav>
          </div>
        </header>
        <div>{children}</div>
      </body>
    </html>
  );
}import './globals.css';
import Nav from './components/Nav';

export const metadata = {
  title: 'Kauri Futsal',
  description: 'Futsal ops',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        <Nav />
        {children}
      </body>
    </html>
  );
}
