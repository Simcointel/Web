import React from 'react';
import { X } from 'lucide-react';

/**
 * Standard page header with title, subtitle, and realm selector
 */
export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactElement<{ size?: number; className?: string }>;
  iconBg?: string;
  iconColor?: string;
  realm?: number;
  onRealmChange?: (realm: number) => void;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  icon,
  iconBg = 'bg-brand-100 dark:bg-brand-900/30',
  iconColor = 'text-brand-600',
  realm = 0,
  onRealmChange,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-4 border-b border-surface-200 dark:border-surface-800">
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center`}>
            {React.cloneElement(icon, { size: 18, className: iconColor })}
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold">{title}</h1>
          {subtitle && <p className="text-xs text-surface-400">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {children}
        {onRealmChange && (
          <select
            value={realm}
            onChange={e => onRealmChange(Number(e.target.value))}
            className="input w-auto"
          >
            <option value={0}>R0</option>
            <option value={1}>R1</option>
          </select>
        )}
      </div>
    </div>
  );
}

/**
 * Metric display box
 */
export interface MetricBoxProps {
  label: string;
  value: string | number;
  className?: string;
}

export function MetricBox({ label, value, className }: MetricBoxProps) {
  return (
    <div className={`border border-surface-200 dark:border-surface-800 rounded-lg p-4 text-center ${className || ''}`}>
      <p className="text-xs font-bold text-surface-500 uppercase mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

/**
 * Chart panel wrapper
 */
export interface ChartPanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartPanel({ title, children, className }: ChartPanelProps) {
  return (
    <div className={`border border-surface-200 dark:border-surface-800 rounded-lg ${className || ''}`}>
      <div className="px-4 py-2 bg-surface-50 dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800 text-xs font-bold uppercase text-surface-500">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/**
 * Section wrapper
 */
export interface SectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({ title, subtitle, children, className }: SectionProps) {
  return (
    <div className={`space-y-4 ${className || ''}`}>
      {(title || subtitle) && (
        <div className="flex items-center justify-between">
          <div>
            {title && <h3 className="text-sm font-bold uppercase tracking-wider text-surface-500">{title}</h3>}
            {subtitle && <p className="text-xs text-surface-400">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Card component
 */
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };
  return (
    <div className={`bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm ${paddingClasses[padding]} ${className || ''}`}>
      {children}
    </div>
  );
}

/**
 * Badge component
 */
export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variantClasses = {
    default: 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300',
    success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    danger: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variantClasses[variant]} ${className || ''}`}>
      {children}
    </span>
  );
}

/**
 * Loading overlay
 */
export interface LoadingOverlayProps {
  text?: string;
  fullScreen?: boolean;
}

export function LoadingOverlay({ text = 'Loading...', fullScreen = false }: LoadingOverlayProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-surface-500">{text}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-surface-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-12">{content}</div>;
}

/**
 * Empty state
 */
export interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ message = 'No data available', icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="w-12 h-12 text-surface-300 dark:text-surface-700 mb-3">{icon}</div>}
      <p className="text-surface-500">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Confirmation dialog
 */
export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const confirmColors = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    primary: 'bg-brand-600 hover:bg-brand-700 text-white',
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-surface-900 w-full max-w-md rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
        <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex justify-between items-center">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors">
            <X size={18} className="text-surface-500" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-surface-600 dark:text-surface-300">{message}</p>
        </div>
        <div className="p-4 border-t border-surface-100 dark:border-surface-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-surface-300 dark:border-surface-700 rounded-lg text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${confirmColors[variant]}`}
          >
            {loading ? '...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}