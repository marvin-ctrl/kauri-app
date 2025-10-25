import Link from 'next/link';

interface DashboardCardProps {
  href: string;
  emoji: string;
  title: string;
  description: string;
  color: 'seafoam' | 'taffy';
}

export default function DashboardCard({
  href,
  emoji,
  title,
  description,
  color,
}: DashboardCardProps) {
  const hoverBorderClass =
    color === 'seafoam' ? 'hover:border-[#79CBC4]' : 'hover:border-[#F289AE]';
  const bgClass = color === 'seafoam' ? 'bg-[#79CBC4]' : 'bg-[#F289AE]';

  return (
    <Link
      href={href}
      className={`group block bg-white border-2 border-[#e2e8f0] ${hoverBorderClass} rounded-xl p-6 hover:shadow-lg transition-all transform hover:-translate-y-1`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-10 h-10 rounded-lg ${bgClass} flex items-center justify-center text-2xl`}
          role="img"
          aria-label={title}
        >
          {emoji}
        </div>
        <h3 className="font-bold text-lg text-[#172F56] font-brand">{title}</h3>
      </div>
      <p className="text-sm text-[#5a718f]">{description}</p>
    </Link>
  );
}
