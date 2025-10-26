diff --git a/lib/theme.ts b/lib/theme.ts
new file mode 100644
index 0000000000000000000000000000000000000000..a1f60fa8ce84448142a160f1b173d2a375aafc4e
--- /dev/null
+++ b/lib/theme.ts
@@ -0,0 +1,19 @@
+export const brandPage = 'min-h-screen bg-brand-gradient px-4 py-10 sm:px-6 lg:px-8';
+export const brandContainer = 'mx-auto flex w-full max-w-6xl flex-col gap-6';
+export const brandCard = 'brand-card';
+export const brandTableCard = 'brand-card overflow-hidden';
+export const brandCardTight = 'brand-card p-6';
+export const brandHeading = 'font-brand text-4xl tracking-tight text-[#172F56]';
+export const subtleText = 'text-[#415572]';
+export const primaryActionButton =
+  'inline-flex items-center justify-center rounded-full bg-[#79CBC4] px-4 py-2 text-sm font-semibold text-[#0f223f] shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#68b8b0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F289AE] focus-visible:ring-offset-2 focus-visible:ring-offset-white';
+export const secondaryActionButton =
+  'inline-flex items-center justify-center rounded-full border border-[#172F56]/15 bg-white/60 px-4 py-2 text-sm font-semibold text-[#172F56] shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#79CBC4] focus-visible:ring-offset-2 focus-visible:ring-offset-white';
+export const dangerActionButton =
+  'inline-flex items-center justify-center rounded-full bg-[#F289AE] px-4 py-2 text-sm font-semibold text-[#172F56] shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#e5679a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#172F56]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white';
+export const subtleButton =
+  'inline-flex items-center justify-center rounded-full border border-white/40 bg-white/30 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#79CBC4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1b35]';
+
+export function cx(...classes: Array<string | false | null | undefined>) {
+  return classes.filter(Boolean).join(' ');
+}
