import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ElementType;
  className?: string;
  headerActions?: React.ReactNode;
}

export function Card({
  children,
  title,
  subtitle,
  icon: Icon,
  className,
  headerActions
}: CardProps) {
  return (
    <div className={cn('ui-card flex flex-col', className)}>
      {(title || Icon) && (
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 bg-sky-50 dark:bg-sky-900/20 rounded-lg text-sky-600 dark:text-sky-400">
                <Icon size={18} />
              </div>
            )}
            <div>
              {title && <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>}
              {subtitle && <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}
      <div className="p-5 flex-1">
        {children}
      </div>
    </div>
  );
}
