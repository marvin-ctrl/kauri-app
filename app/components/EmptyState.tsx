'use client';

type Props = {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export default function EmptyState({ icon = 'ℹ️', title, description, action }: Props) {
  return (
    <div className="grid place-items-center rounded-xl border border-neutral-200 bg-white/60 p-10 text-center">
      <div className="text-4xl">{icon}</div>
      <h2 className="mt-2 text-xl font-semibold text-[#172F56]">{title}</h2>
      {description && <p className="mt-1 text-sm text-[#0f1f3b]/70">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
