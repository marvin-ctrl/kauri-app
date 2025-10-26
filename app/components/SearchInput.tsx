'use client';

import { cx, subtleText } from '@/lib/theme';

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  className?: string;
  showIcon?: boolean;
};

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  label,
  id = 'search-input',
  className,
  showIcon = true
}: SearchInputProps) {
  return (
    <div className={cx('flex flex-col gap-2', className)}>
      {label && (
        <label
          htmlFor={id}
          className={cx('text-xs font-semibold uppercase tracking-[0.3em]', subtleText)}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {showIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <svg
              className="h-4 w-4 text-[#415572]/70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        )}
        <input
          id={id}
          type="search"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={cx(
            'w-full rounded-full border border-white/50 bg-white/80 py-2 text-sm text-[#172F56] shadow-inner placeholder:text-[#415572]/70',
            'transition-all duration-200',
            'focus:border-[#79CBC4] focus:outline-none focus:ring-2 focus:ring-[#79CBC4]/60 focus:ring-offset-1 focus:ring-offset-white/30',
            'hover:border-white/70 hover:bg-white/90',
            showIcon ? 'pl-10 pr-4' : 'px-4'
          )}
          aria-label={label || 'Search'}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#415572]/70 hover:text-[#172F56] transition-colors"
            aria-label="Clear search"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
