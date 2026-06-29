import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  isLoading,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'btn-ui-primary',
    secondary: 'btn-ui-secondary',
    ghost: 'btn-ui-ghost',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-900/10'
  };

  const sizes = {
    sm: 'btn-ui-sm',
    md: 'btn-ui-md',
    lg: 'btn-ui-lg'
  };

  return (
    <button
      className={cn(
        'btn-ui',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
}
