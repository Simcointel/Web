import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  className?: string;
  dot?: boolean;
}

export function Badge({
  children,
  variant = 'neutral',
  className,
  dot
}: BadgeProps) {
  const variants = {
    success: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50',
    warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50',
    error: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/50',
    info: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border-sky-200/50 dark:border-sky-800/50',
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  };

  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-500'
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border',
      variants[variant],
      className
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}
