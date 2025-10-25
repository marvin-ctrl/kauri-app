'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    router.push('/login');
  }, [router]);

  return (
    <main className="min-h-screen grid place-items-center bg-gradient-to-br from-[#172F56] to-[#79CBC4]">
      <div className="text-white text-xl">Redirecting…</div>
    </main>
  );
}
