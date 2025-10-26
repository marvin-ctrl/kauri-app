import './globals.css';
import type { Metadata } from 'next';
import Nav from './components/Nav';

export const metadata: Metadata = {
  title: 'Kauri Futsal',
  description: 'Club admin',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body bg-[var(--bg)] text-[var(--fg)]">
        <Nav />
        <div>{children}</div>
      </body>
    </html>
  );
}
