export function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    critical: { bg: "bg-rose-100 dark:bg-rose-900/40", text: "text-rose-700 dark:text-rose-400", border: "border-rose-200 dark:border-rose-800", icon: "🔴" },
    warning: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800", icon: "🟡" },
    info: { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800", icon: "🔵" },
  };
  const s = severity.toLowerCase();
  const style = styles[s] ?? { bg: "bg-surface-100 dark:bg-surface-800", text: "text-surface-600 dark:text-surface-400", border: "border-surface-200 dark:border-surface-700", icon: "⚪" };
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${style.bg} ${style.text} ${style.border}`} role="status" aria-live="polite">
      <span aria-hidden="true">{style.icon}</span>
      {severity}
    </span>
  );
}
