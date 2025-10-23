import './globals.css';
import Nav from './components/Nav';

export const metadata = {
  title: 'Kauri',
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
