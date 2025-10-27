'use client';

export default function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="grid place-items-center p-10">
      <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#172F56]/30 border-t-[#172F56]" />
      <p className="text-sm text-[#172F56]/80">{message}</p>
    </div>
  );
}
