export default function Home() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold mb-4">Kauri Futsal — V1</h1>
      <p className="text-sm text-gray-600 mb-6">
        Use the links below to open each feature.
      </p>
      <ul className="space-y-3">
        <li>
          <a className="block rounded border px-4 py-3 hover:bg-gray-50" href="/login">
            Login (magic link)
            <div className="text-xs text-gray-500">Sign in via email</div>
          </a>
        </li>
        <li>
          <a className="block rounded border px-4 py-3 hover:bg-gray-50" href="/dashboard">
            Schedule (events)
            <div className="text-xs text-gray-500">Lists events from Supabase</div>
          </a>
        </li>
        <li>
          <a className="block rounded border px-4 py-3 hover:bg-gray-50" href="/attendance">
            Attendance (quick roll)
            <div className="text-xs text-gray-500">Mark Present / Absent / Late</div>
          </a>
        </li>
      </ul>
      <p className="text-xs text-gray-500 mt-6">
        Tip: Add at least one row in <code>events</code> (Supabase → Table editor) so
        /dashboard has something to show.
      </p>
    </main>
  );
}
