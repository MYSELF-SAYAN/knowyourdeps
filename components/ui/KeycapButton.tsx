'use client';

import React from 'react';

export type KeycapButtonVariant = 'primary' | 'white' | 'dark' | 'secondary';

interface KeycapButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: KeycapButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function KeycapButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: KeycapButtonProps) {
  const baseClasses =
    'relative isolate inline-flex shrink-0 cursor-pointer items-center justify-center font-semibold select-none transition-all duration-100 focus-visible:outline-2 focus-visible:outline-offset-2';

  const sizeClasses = {
    sm: 'h-9 px-3.5 text-[13px] rounded-[10px]',
    md: 'h-11 px-5 text-[14px] rounded-[12px]',
    lg: 'h-[50px] land:h-[56px] px-6 text-[15px] rounded-[12px]',
  }[size];

  const variantClasses = {
    primary:
      'bg-[#1d53c6] text-white shadow-[0_3px_0_#19409b] hover:bg-[#19409b] active:translate-y-[2px] active:shadow-[0_1px_0_#19409b] focus-visible:outline-[#1d53c6]',
    white:
      'bg-white text-[#0f172a] border border-[#e2e8f0] shadow-[0_2px_0_#cbd5e1] hover:bg-[#eff6ff] hover:border-[#bfdbfe] hover:text-[#1d53c6] active:translate-y-[2px] active:shadow-[0_1px_0_#cbd5e1] focus-visible:outline-[#1d53c6]',
    secondary:
      'bg-white text-[#0f172a] border border-[#e2e8f0] shadow-[0_2px_0_#cbd5e1] hover:bg-[#eff6ff] hover:border-[#bfdbfe] hover:text-[#1d53c6] active:translate-y-[2px] active:shadow-[0_1px_0_#cbd5e1] focus-visible:outline-[#1d53c6]',
    dark:
      'bg-[#0f172a] text-white shadow-[0_3px_0_#020617] hover:bg-[#1e293b] active:translate-y-[2px] active:shadow-[0_1px_0_#020617] focus-visible:outline-[#1d53c6]',
  }[variant];

  return (
    <button className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
}
