diff --git a/app/events/page.tsx b/app/events/page.tsx
index a5bb6c96f52425c31c1e87fc47685b51f06ec5c6..00ea1dfe7ef3707023a8ca72db152894dc053e17 100644
--- a/app/events/page.tsx
+++ b/app/events/page.tsx
@@ -1,90 +1,126 @@
 'use client';
 
 import { useEffect, useState } from 'react';
 import Link from 'next/link';
 import { createClient } from '@supabase/supabase-js';
+import LoadingState from '@/app/components/LoadingState';
+import EmptyState from '@/app/components/EmptyState';
+import {
+  brandCard,
+  brandContainer,
+  brandHeading,
+  brandPage,
+  brandTableCard,
+  cx,
+  primaryActionButton,
+  subtleText
+} from '@/lib/theme';
 
 const supabase = createClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 );
 
 type EventRow = {
   id: string;
   title: string | null;
   type: string;
   location: string | null;
   starts_at: string;
 };
 
 export default function EventsPage() {
   const [rows, setRows] = useState<EventRow[]>([]);
   const [loading, setLoading] = useState(true);
   const [msg, setMsg] = useState<string | null>(null);
 
   useEffect(() => {
     (async () => {
       setLoading(true);
       setMsg(null);
       const { data, error } = await supabase
         .from('events')
         .select('id, title, type, location, starts_at')
         .order('starts_at', { ascending: true });
       if (error) setMsg(error.message);
       setRows(data || []);
       setLoading(false);
     })();
   }, []);
 
-  if (loading) return <main className="min-h-screen grid place-items-center">Loading…</main>;
+  if (loading) {
+    return (
+      <main className={brandPage}>
+        <LoadingState message="Loading events…" />
+      </main>
+    );
+  }
 
   return (
-    <main className="min-h-screen p-6">
-      <div className="max-w-4xl mx-auto space-y-4">
-        <header className="flex items-center justify-between">
-          <h1 className="text-3xl font-extrabold tracking-tight">Events</h1>
-          <Link href="/events/new" className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold">
+    <main className={brandPage}>
+      <div className={brandContainer}>
+        <header className={cx(brandCard, 'flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between')}>
+          <div className="space-y-1">
+            <h1 className={cx(brandHeading, 'text-3xl sm:text-4xl')}>Events</h1>
+            <p className={cx('text-sm', subtleText)}>Manage match days, trainings, and key club happenings.</p>
+          </div>
+          <Link href="/events/new" className={primaryActionButton}>
             New event
           </Link>
         </header>
 
-        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
-          <table className="w-full text-sm">
-            <thead className="bg-neutral-100 border-b border-neutral-200">
-              <tr>
-                <th className="text-left p-3">When</th>
-                <th className="text-left p-3">Type</th>
-                <th className="text-left p-3">Title</th>
-                <th className="text-left p-3">Location</th>
-                <th className="text-left p-3">Actions</th>
-              </tr>
-            </thead>
-            <tbody>
-              {rows.map(ev => (
-                <tr key={ev.id} className="border-b border-neutral-100">
-                  <td className="p-3">
-                    {new Date(ev.starts_at).toLocaleString('en-NZ', {
-                      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
-                    })}
-                  </td>
-                  <td className="p-3">{ev.type}</td>
-                  <td className="p-3">{ev.title ?? '—'}</td>
-                  <td className="p-3">{ev.location ?? '—'}</td>
-                  <td className="p-3">
-                    <Link href={`/events/${ev.id}/roll`} className="underline text-blue-700 hover:text-blue-800">
-                      Take roll
-                    </Link>
-                  </td>
+        {rows.length > 0 ? (
+          <section className={cx(brandTableCard, 'overflow-hidden')}>
+            <table className="w-full text-sm">
+              <thead className="border-b border-white/40 bg-white/40 text-[#0f1f3b]">
+                <tr>
+                  <th className="text-left px-4 py-3">When</th>
+                  <th className="text-left px-4 py-3">Type</th>
+                  <th className="text-left px-4 py-3">Title</th>
+                  <th className="text-left px-4 py-3">Location</th>
+                  <th className="text-left px-4 py-3">Actions</th>
                 </tr>
-              ))}
-              {rows.length === 0 && (
-                <tr><td className="p-4 text-neutral-700" colSpan={5}>No events.</td></tr>
-              )}
-            </tbody>
-          </table>
-        </section>
+              </thead>
+              <tbody>
+                {rows.map(ev => (
+                  <tr key={ev.id} className="border-b border-white/20 bg-white/60 text-[#0f1f3b] last:border-0">
+                    <td className="px-4 py-3">
+                      {new Date(ev.starts_at).toLocaleString('en-NZ', {
+                        weekday: 'short',
+                        month: 'short',
+                        day: 'numeric',
+                        hour: '2-digit',
+                        minute: '2-digit'
+                      })}
+                    </td>
+                    <td className="px-4 py-3 font-semibold uppercase tracking-wide text-[#172F56]">{ev.type}</td>
+                    <td className="px-4 py-3">{ev.title ?? '—'}</td>
+                    <td className="px-4 py-3">{ev.location ?? '—'}</td>
+                    <td className="px-4 py-3">
+                      <Link
+                        href={`/events/${ev.id}/roll`}
+                        className="font-semibold text-[#172F56] underline decoration-2 underline-offset-4 hover:text-[#0b1730]"
+                      >
+                        Take roll
+                      </Link>
+                    </td>
+                  </tr>
+                ))}
+              </tbody>
+            </table>
+          </section>
+        ) : (
+          <EmptyState
+            icon="📅"
+            title="No events scheduled"
+            description="Keep the club informed by adding trainings, fixtures, or whānau events."
+            action={<Link href="/events/new" className={primaryActionButton}>Schedule an event</Link>}
+          />
+        )}
 
-        {msg && <p className="text-sm text-red-800">{msg}</p>}
+        {msg && (
+          <div className={cx(brandCard, 'border border-[#F289AE]/40 bg-[#F289AE]/20 p-4 text-sm text-[#742348]')}>{msg}</div>
+        )}
       </div>
     </main>
   );
 }
