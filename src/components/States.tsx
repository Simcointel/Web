import { useState } from "react";

export function LoadingState({ text = "Loading data..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-surface-400">{text}</span>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const [retrying, setRetrying] = useState(false);
  const handleRetry = () => {
    if (retrying) return;
    setRetrying(true);
    onRetry?.();
    setTimeout(() => setRetrying(false), 1000);
  };
  return (
    <div className="text-center py-12">
      <p className="text-sm text-red-600 dark:text-red-400 mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {retrying ? "Retrying..." : "Retry"}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = "No data available" }: { message?: string }) {
  return <p className="text-sm text-surface-400 text-center py-8">{message}</p>;
}
