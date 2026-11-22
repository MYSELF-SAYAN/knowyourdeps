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
    safe: 'bg-[#eff6ff] text-[#19409b] border border-[#bfdbfe]',
    success: 'bg-[#eefcf3] text-[#0d7a42] border border-[#bcf2ce]',
    vulnerable: 'bg-[#feecee] text-[#b82429] border border-[#fcccd1]',
    danger: 'bg-[#feecee] text-[#b82429] border border-[#fcccd1]',
    warning: 'bg-[#fff4e8] text-[#994800] border border-[#ffe2c7]',
    neutral: 'bg-[#f8fafc] text-[#475569] border border-[#e2e8f0]',
    default: 'bg-[#f8fafc] text-[#475569] border border-[#e2e8f0]',
    accent: 'bg-[#1d53c6] text-white',
    primary: 'bg-[#1d53c6] text-white',
    tangerine: 'bg-[#ff7a00] text-white',
  };

  const variantClass = variantClassMap[variant] || variantClassMap.neutral;

  return (
    <span className={`inline-flex items-center gap-1 font-medium select-none ${sizeClass} ${variantClass} ${className}`}>
      {children}
    </span>
  );
}
