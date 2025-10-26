diff --git a/app/terms/page.tsx b/app/terms/page.tsx
index 556635e7c5b5f877ef12b4c9c5419d029af5d95d..648a2f6c30d693223de7150f308d2dc028c90f21 100644
--- a/app/terms/page.tsx
+++ b/app/terms/page.tsx
@@ -1,75 +1,112 @@
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
 
 type Term = { id: string; year: number; term: number; start_date: string | null; end_date: string | null };
 
 export default function TermsPage() {
   const [rows, setRows] = useState<Term[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     (async () => {
       const { data } = await supabase.from('terms').select('id,year,term,start_date,end_date').order('year', { ascending: false }).order('term', { ascending: true });
       setRows(data || []);
       setLoading(false);
     })();
   }, []);
 
-  if (loading) return <main className="min-h-screen grid place-items-center">Loading…</main>;
+  if (loading) {
+    return (
+      <main className={brandPage}>
+        <LoadingState message="Loading terms…" />
+      </main>
+    );
+  }
 
   return (
-    <main className="min-h-screen p-6">
-      <div className="max-w-3xl mx-auto space-y-4">
-        <header className="flex items-center justify-between">
-          <h1 className="text-3xl font-extrabold tracking-tight">Terms</h1>
-          <Link href="/terms/new" className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold">New term</Link>
+    <main className={brandPage}>
+      <div className={brandContainer}>
+        <header className={cx(brandCard, 'flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between')}>
+          <div className="space-y-1">
+            <h1 className={cx(brandHeading, 'text-3xl sm:text-4xl')}>Terms</h1>
+            <p className={cx('text-sm', subtleText)}>Track school terms to tie events, fees, and teams together.</p>
+          </div>
+          <Link href="/terms/new" className={primaryActionButton}>
+            New term
+          </Link>
         </header>
 
-        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm">
-          <table className="w-full text-sm">
-            <thead className="border-b border-neutral-200 bg-neutral-100">
-              <tr>
-                <th className="text-left p-3">Year</th>
-                <th className="text-left p-3">Term</th>
-                <th className="text-left p-3">Dates</th>
-                <th className="text-left p-3">Actions</th>
-              </tr>
-            </thead>
-            <tbody>
-              {rows.map(t => (
-                <tr key={t.id} className="border-b border-neutral-100 hover:bg-neutral-50">
-                  <td className="p-3">{t.year}</td>
-                  <td className="p-3">Term {t.term}</td>
-                  <td className="p-3">
-                    {(t.start_date ? new Date(t.start_date).toLocaleDateString('en-NZ') : '—') + ' → ' +
-                     (t.end_date ? new Date(t.end_date).toLocaleDateString('en-NZ') : '—')}
-                  </td>
-                  <td className="p-3">
-                    <Link href={`/terms/${t.id}/edit`} className="underline text-blue-700 hover:text-blue-800">Edit</Link>
-                    <button
-                      onClick={async () => { if (!confirm('Delete this term?')) return;
-                        await supabase.from('terms').delete().eq('id', t.id);
-                        location.reload();
-                      }}
-                      className="ml-3 text-red-700 underline"
-                    >
-                      Delete
-                    </button>
-                  </td>
+        {rows.length > 0 ? (
+          <section className={cx(brandTableCard, 'overflow-hidden')}>
+            <table className="w-full text-sm">
+              <thead className="border-b border-white/40 bg-white/40 text-[#0f1f3b]">
+                <tr>
+                  <th className="text-left px-4 py-3">Year</th>
+                  <th className="text-left px-4 py-3">Term</th>
+                  <th className="text-left px-4 py-3">Dates</th>
+                  <th className="text-left px-4 py-3">Actions</th>
                 </tr>
-              ))}
-              {rows.length === 0 && <tr><td className="p-4 text-neutral-700" colSpan={4}>No terms.</td></tr>}
-            </tbody>
-          </table>
-        </section>
+              </thead>
+              <tbody>
+                {rows.map(t => (
+                  <tr key={t.id} className="border-b border-white/20 bg-white/60 text-[#0f1f3b] last:border-0">
+                    <td className="px-4 py-3 font-semibold text-[#172F56]">{t.year}</td>
+                    <td className="px-4 py-3">Term {t.term}</td>
+                    <td className="px-4 py-3">
+                      {(t.start_date ? new Date(t.start_date).toLocaleDateString('en-NZ') : '—') + ' → ' +
+                        (t.end_date ? new Date(t.end_date).toLocaleDateString('en-NZ') : '—')}
+                    </td>
+                    <td className="px-4 py-3">
+                      <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#172F56]">
+                        <Link href={`/terms/${t.id}/edit`} className="underline decoration-2 underline-offset-4 hover:text-[#0b1730]">
+                          Edit
+                        </Link>
+                        <span className="text-white/40">•</span>
+                        <button
+                          onClick={async () => {
+                            if (!confirm('Delete this term?')) return;
+                            await supabase.from('terms').delete().eq('id', t.id);
+                            location.reload();
+                          }}
+                          className="text-[#c41d5e] underline decoration-2 underline-offset-4 transition hover:text-[#9b1549]"
+                        >
+                          Delete
+                        </button>
+                      </div>
+                    </td>
+                  </tr>
+                ))}
+              </tbody>
+            </table>
+          </section>
+        ) : (
+          <EmptyState
+            icon="🗓️"
+            title="No terms set up"
+            description="Add the current school term so you can organise competitions and fees."
+            action={<Link href="/terms/new" className={primaryActionButton}>Add a term</Link>}
+          />
+        )}
       </div>
     </main>
   );
 }
