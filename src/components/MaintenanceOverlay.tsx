import { useState, useEffect } from "react";
import { AlertTriangle, RefreshCw, Clock } from "lucide-react";

interface MaintenanceOverlayProps {
  title: string;
  message: string;
  retryAfter: number;
  onRetry: () => void;
}

export function MaintenanceOverlay({ title, message, retryAfter, onRetry }: MaintenanceOverlayProps) {
  const [countdown, setCountdown] = useState(retryAfter);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          // Re-check the remote flag when the countdown reaches zero.
          onRetry();
          return retryAfter;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAfter, onRetry]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div
      role="alertdialog"
      aria-labelledby="maintenance-title"
      aria-describedby="maintenance-message"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-950/95 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20">
          <AlertTriangle className="h-10 w-10 text-amber-400" aria-hidden="true" />
        </div>

        {/* Title */}
        <h1 id="maintenance-title" className="mb-3 text-2xl font-bold text-white">
          {title}
        </h1>

        {/* Message */}
        <p id="maintenance-message" className="mb-6 text-surface-500 leading-relaxed">
          {message}
        </p>

        {/* Countdown */}
        <div className="mb-6 flex items-center justify-center gap-2 text-surface-500">
          <Clock className="h-4 w-4" aria-hidden="true" />
          <span className="font-mono text-lg font-semibold text-white">
            Auto-retry in {formatTime(countdown)}
          </span>
        </div>

        {/* Retry button */}
        <button
          onClick={onRetry}
          className="mx-auto inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-400 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Check Again Now
        </button>

        {/* Accessibility: hidden live region for countdown updates */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {countdown <= 60 ? `Auto-retry in ${countdown} seconds` : ""}
        </div>
      </div>
    </div>
  );
}