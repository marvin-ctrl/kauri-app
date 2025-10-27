// tiny classnames helper
export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

// semantic class tokens (Tailwind-based)
export const brandPage = 'min-h-screen bg-gradient-to-b from-[#E6F3FF] to-[#F6F7FB]';

export const brandContainer = 'mx-auto max-w-5xl space-y-5 p-6';

export const brandCard =
  'rounded-xl border border-white/50 bg-white/60 backdrop-blur shadow-sm';

export const brandTableCard =
  'rounded-xl border border-white/50 bg-white/60 backdrop-blur shadow-sm';

export const brandHeading = 'font-extrabold tracking-tight text-[#0f1f3b]';

export const subtleText = 'text-[#0f1f3b]/70';

export const primaryActionButton =
  'inline-flex items-center justify-center rounded-md border border-[#172F56] px-4 py-2 font-semibold text-white bg-[#172F56] hover:bg-[#0b1730] transition';
