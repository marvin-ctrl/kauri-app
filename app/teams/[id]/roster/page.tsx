diff --git a/app/teams/[id]/roster/page.tsx b/app/teams/[id]/roster/page.tsx
index 295c3685249a1effc4b2997371be0e2b8d730a23..2f4c9985a4c7a95296523a808005de306aa4ba29 100644
--- a/app/teams/[id]/roster/page.tsx
+++ b/app/teams/[id]/roster/page.tsx
@@ -1,30 +1,42 @@
 'use client';
 
 import { useEffect, useState } from 'react';
 import { useParams } from 'next/navigation';
 import { createClient } from '@supabase/supabase-js';
+import LoadingState from '@/app/components/LoadingState';
+import EmptyState from '@/app/components/EmptyState';
+import {
+  brandCard,
+  brandContainer,
+  brandHeading,
+  brandPage,
+  cx,
+  primaryActionButton,
+  secondaryActionButton,
+  subtleText
+} from '@/lib/theme';
 
 const supabase = createClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL!,
   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 );
 
 type Team = { id: string; name: string };
 type RosterRow = {
   membershipId: string;
   playerId: string;
   firstName: string;
   lastName: string;
   preferredName: string | null;
   jerseyNo: number | null;
   role: string;
 };
 
 export default function TeamRosterPage() {
   const { id: teamId } = useParams<{ id: string }>();
   const [team, setTeam] = useState<Team | null>(null);
   const [roster, setRoster] = useState<RosterRow[]>([]);
   const [loading, setLoading] = useState(true);
   const [msg, setMsg] = useState<string | null>(null);
 
   async function load() {
@@ -128,106 +140,105 @@ export default function TeamRosterPage() {
     }
   }
 
   useEffect(() => {
     load();
   }, [teamId]);
 
   async function remove(membershipId: string) {
     setMsg(null);
     if (!confirm('Remove this player from the team?')) return;
     
     const { error } = await supabase
       .from('memberships')
       .delete()
       .eq('id', membershipId);
     
     if (error) {
       setMsg(`Error: ${error.message}`);
       return;
     }
     
     await load();
   }
 
   if (loading) {
-    return <main className="min-h-screen grid place-items-center">Loading…</main>;
+    return (
+      <main className={brandPage}>
+        <LoadingState message="Loading roster…" />
+      </main>
+    );
   }
 
   return (
-    <main className="min-h-screen p-6">
-      <div className="max-w-4xl mx-auto space-y-4">
-        <header className="flex items-center justify-between">
-          <div>
-            <h1 className="text-3xl font-extrabold tracking-tight">{team?.name || 'Team'}</h1>
-            <p className="text-sm text-neutral-700">Roster</p>
-          </div>
-          <div className="flex gap-2">
-            <a
-              href={`/teams/${teamId}/assign`}
-              className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold"
-            >
-              Add players
-            </a>
-            <a
-              href="/teams"
-              className="px-3 py-2 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold"
-            >
-              Back to Teams
-            </a>
-          </div>
-        </header>
-
-        <section className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
-          {roster.length === 0 ? (
-            <div className="text-center py-8">
-              <p className="text-neutral-700 mb-4">No players on this team for the current term.</p>
-              <a
-                href={`/teams/${teamId}/assign`}
-                className="inline-block px-4 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-semibold"
-              >
+    <main className={brandPage}>
+      <div className={brandContainer}>
+        <div className={cx(brandCard, 'mx-auto flex w-full max-w-4xl flex-col gap-6 p-6 sm:p-8')}>
+          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
+            <div className="space-y-1">
+              <h1 className={cx(brandHeading, 'text-3xl sm:text-4xl')}>{team?.name || 'Team'}</h1>
+              <p className={cx('text-sm', subtleText)}>Current term roster and roles.</p>
+            </div>
+            <div className="flex flex-wrap gap-2">
+              <a href={`/teams/${teamId}/assign`} className={primaryActionButton}>
                 Add players
               </a>
+              <a href="/teams" className={secondaryActionButton}>
+                Back to teams
+              </a>
             </div>
+          </header>
+
+          {roster.length === 0 ? (
+            <EmptyState
+              icon="📋"
+              title="No players on this roster"
+              description={msg ?? 'Assign players for this term to start building the roster.'}
+              action={<a href={`/teams/${teamId}/assign`} className={primaryActionButton}>Assign players</a>}
+            />
           ) : (
-            <ul className="space-y-2">
-              {roster.map((row) => {
-                const name = row.preferredName || `${row.firstName} ${row.lastName}`;
-                return (
-                  <li
-                    key={row.membershipId}
-                    className="flex items-center justify-between border border-neutral-200 rounded-md p-3 hover:bg-neutral-50"
-                  >
-                    <div className="text-sm">
-                      <span className="font-semibold">{name}</span>
-                      {row.jerseyNo != null && (
-                        <span className="ml-2 text-neutral-700">#{row.jerseyNo}</span>
-                      )}
-                      {row.role && row.role !== 'player' && (
-                        <span className="ml-2 text-neutral-700">• {row.role}</span>
-                      )}
-                    </div>
-                    <div className="flex items-center gap-2">
-                      <a
-                        href={`/players/${row.playerId}`}
-                        className="text-sm underline text-blue-700 hover:text-blue-800"
-                      >
-                        Profile
-                      </a>
-                      <button
-                        onClick={() => remove(row.membershipId)}
-                        className="px-2 py-1 rounded bg-red-700 hover:bg-red-800 text-white text-xs"
-                      >
-                        Remove
-                      </button>
-                    </div>
-                  </li>
-                );
-              })}
-            </ul>
+            <section className="space-y-3">
+              <ul className="space-y-3">
+                {roster.map(row => {
+                  const name = row.preferredName || `${row.firstName} ${row.lastName}`;
+                  return (
+                    <li
+                      key={row.membershipId}
+                      className="flex flex-col gap-3 rounded-2xl border border-white/40 bg-white/75 p-4 shadow-[0_18px_40px_-30px_rgba(23,47,86,0.6)] sm:flex-row sm:items-center sm:justify-between"
+                    >
+                      <div className="text-sm">
+                        <span className="text-lg font-semibold text-[#172F56]">{name}</span>
+                        {row.jerseyNo != null && <span className="ml-2 text-sm font-medium text-[#415572]">#{row.jerseyNo}</span>}
+                        {row.role && row.role !== 'player' && (
+                          <span className="ml-2 inline-flex items-center rounded-full bg-[#79CBC4]/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f3a37]">
+                            {row.role}
+                          </span>
+                        )}
+                      </div>
+                      <div className="flex flex-wrap items-center gap-2">
+                        <a
+                          href={`/players/${row.playerId}`}
+                          className="text-sm font-semibold text-[#172F56] underline decoration-2 underline-offset-4 hover:text-[#0b1730]"
+                        >
+                          Profile
+                        </a>
+                        <button
+                          onClick={() => remove(row.membershipId)}
+                          className="rounded-full bg-[#F289AE] px-3 py-1 text-xs font-semibold text-[#172F56] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#e5679a]"
+                        >
+                          Remove
+                        </button>
+                      </div>
+                    </li>
+                  );
+                })}
+              </ul>
+              {msg && (
+                <div className="rounded-2xl border border-[#F289AE]/40 bg-[#F289AE]/20 px-4 py-3 text-sm text-[#742348]">{msg}</div>
+              )}
+            </section>
           )}
-          {msg && <p className="mt-3 text-sm text-red-800">{msg}</p>}
-        </section>
+        </div>
       </div>
     </main>
   );
 }
