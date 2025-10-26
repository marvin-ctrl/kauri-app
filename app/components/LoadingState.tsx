'use client';

import { cx } from '@/lib/theme';

type LoadingStateProps = {
 message?: string;
 fullHeight?: boolean;
 surface?: 'page' | 'card';
 className?: string;
};

export default function LoadingState({
 message = 'Loading…',
 fullHeight = true,
 surface = 'page',
 className
}: LoadingStateProps) {
 const textColor = surface === 'page' ? 'text-white' : 'text-[#172F56]';
 const spinnerColor =
   surface === 'page'
     ? 'border-white/20 border-t-[#F289AE]'
     : 'border-[#172F56]/20 border-t-[#172F56]';

 return (
   <div
     role="status"
     aria-live="polite"
     className={cx(
       'flex flex-col items-center justify-center gap-4 text-center',
       fullHeight && 'min-h-[50vh]',
       textColor,
       className
     )}
   >
     <span
       className={cx(
         'h-12 w-12 rounded-full border-4 animate-spin',
         spinnerColor
       )}
       aria-hidden
     />
     <p className="text-sm font-semibold tracking-[0.2em] uppercase">{message}</p>
   </div>
 );
}
