import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ElementType;
}

export function Input({
  label,
  error,
  helperText,
  icon: Icon,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || React.useId();

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="txt-label block ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon size={16} />
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'input-ui',
            Icon && 'pl-10',
            error && 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] font-semibold text-rose-500 ml-1 italic">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-slate-500 ml-1">{helperText}</p>}
    </div>
  );
}
