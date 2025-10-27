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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Poppins:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-[var(--bg)] text-[var(--fg)]">
        <Nav />
        <div>{children}</div>
      </body>
    </html>
  );
}
