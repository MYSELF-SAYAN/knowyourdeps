import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-[10px] bg-[#e8eef7] ${className}`}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3.5 bg-[#e8eef7] rounded-[6px] animate-pulse"
          style={{ width: i === lines - 1 && lines > 1 ? '65%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({
  className = '',
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`p-5 bg-white border border-[#dce7f5] rounded-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${className}`}
    >
      {children}
    </div>
  );
}

export function SkeletonBadge({ className = '' }: { className?: string }) {
  return (
    <div className={`h-6 w-16 bg-[#e8eef7] rounded-[8px] animate-pulse ${className}`} />
  );
}
