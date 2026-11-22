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
      'bg-[#0033ff] text-white shadow-[0_4px_0_#0026bf] hover:bg-[#002be6] active:translate-y-[3px] active:shadow-[0_1px_0_#0026bf] focus-visible:outline-[#0033ff]',
    white:
      'bg-white text-[#1a1a1a] border border-[#e8e8e8] shadow-[0_3px_0_#d9d9d9] hover:bg-[#fafafa] active:translate-y-[2px] active:shadow-[0_1px_0_#d9d9d9] focus-visible:outline-[#1a1a1a]',
    secondary:
      'bg-white text-[#1a1a1a] border border-[#e8e8e8] shadow-[0_3px_0_#d9d9d9] hover:bg-[#fafafa] active:translate-y-[2px] active:shadow-[0_1px_0_#d9d9d9] focus-visible:outline-[#1a1a1a]',
    dark:
      'bg-[#212121] text-white shadow-[0_3px_0_#000000] hover:bg-[#2e2e2e] active:translate-y-[2px] active:shadow-[0_1px_0_#000000] focus-visible:outline-[#0033ff]',
  }[variant];

  return (
    <button className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
}
