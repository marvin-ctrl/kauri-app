diff --git a/app/components/EmptyState.tsx b/app/components/EmptyState.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..7352e2e471bcb385243b489e682a96d8736ed598
--- /dev/null
+++ b/app/components/EmptyState.tsx
@@ -0,0 +1,27 @@
+'use client';
+
+import { ReactNode } from 'react';
+import { brandCard, cx, subtleText } from '@/lib/theme';
+
+type EmptyStateProps = {
+  icon: ReactNode;
+  title: string;
+  description: string;
+  action?: ReactNode;
+  className?: string;
+};
+
+export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
+  return (
+    <div className={cx(brandCard, 'flex flex-col items-center justify-center gap-4 px-6 py-12 text-center', className)}>
+      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70 text-3xl shadow-inner shadow-white/60">
+        {icon}
+      </div>
+      <div className="space-y-2">
+        <h3 className="text-xl font-semibold text-[#172F56]">{title}</h3>
+        <p className={cx('text-sm', subtleText)}>{description}</p>
+      </div>
+      {action ? <div>{action}</div> : null}
+    </div>
+  );
+}
