import './globals.css';
import type { Metadata } from 'next';
import Nav from './components/Nav'; // Fixed: changed from @/components/Nav to ./components/Nav

export const metadata: Metadata = {
  title: 'Kauri Futsal',
  description: 'Club admin',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900">
        <Nav />
        <div>{children}</div>
      </body>
    </html>
  );
}
