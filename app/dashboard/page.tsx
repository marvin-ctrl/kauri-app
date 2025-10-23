import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function DashboardPage() {
  // Check auth (server-side)
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch upcoming events
  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      teams(name)
    `)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(10);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-gray-600 text-sm">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
          
          {!events || events.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No upcoming events. Create one to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">
                          {event.type === 'training' && '🏋️'}
                          {event.type === 'game' && '⚽'}
                          {event.type === 'tournament' && '🏆'}
                          {event.title || event.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        📍 {event.location}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(event.starts_at).toLocaleString('en-NZ', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
