export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center bg-neutral-50 text-neutral-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-neutral-600 mb-6">The page you're looking for doesn't exist.</p>
        <a href="/" className="text-blue-600 hover:underline">
          Return to home
        </a>
      </div>
    </main>
  );
}
