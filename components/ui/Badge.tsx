import React from 'react';

export type BadgeVariant =
  | 'safe'
  | 'vulnerable'
  | 'warning'
  | 'neutral'
  | 'accent'
  | 'tangerine'
  | 'success'
  | 'danger'
  | 'default'
  | 'primary';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', size = 'md', children, className = '' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px] rounded-[6px]' : 'px-2.5 py-1 text-[12px] rounded-[8px]';

  const variantClassMap: Record<BadgeVariant, string> = {
    safe: 'bg-[#ebefff] text-[#0033ff] border border-[#c7d3ff]',
    success: 'bg-[#eefcf3] text-[#17a45c] border border-[#bcf2ce]',
    vulnerable: 'bg-[#feecee] text-[#e5484d] border border-[#fcccd1]',
    danger: 'bg-[#feecee] text-[#e5484d] border border-[#fcccd1]',
    warning: 'bg-[#fff4e8] text-[#bf5b00] border border-[#ffe2c7]',
    neutral: 'bg-[#f4f4f4] text-[#6e6e6e] border border-[#e8e8e8]',
    default: 'bg-[#f4f4f4] text-[#6e6e6e] border border-[#e8e8e8]',
    accent: 'bg-[#0033ff] text-white',
    primary: 'bg-[#0033ff] text-white',
    tangerine: 'bg-[#ff7a00] text-white',
  };

  const variantClass = variantClassMap[variant] || variantClassMap.neutral;

  return (
    <span className={`inline-flex items-center gap-1 font-medium select-none ${sizeClass} ${variantClass} ${className}`}>
      {children}
    </span>
  );
}
