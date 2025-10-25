import './globals.css';
import type { Metadata } from 'next';
import Nav from './components/Nav';
import { Oswald, Poppins } from 'next/font/google';

const oswald = Oswald({ 
  subsets: ['latin'], 
  weight: ['700'], 
  variable: '--font-heading' 
});

const poppins = Poppins({ 
  subsets: ['latin'], 
  weight: ['400','500','600'], 
  variable: '--font-body' 
});

export const metadata: Metadata = {
  title: 'Kauri Futsal',
  description: 'Club admin',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${oswald.variable} font-body bg-[var(--bg)] text-[var(--fg)]`}>
        <Nav />
        <div>{children}</div>
      </body>
    </html>
  );
}
