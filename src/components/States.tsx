export function LoadingState({ text = "Loading data..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">{text}</span>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-red-600 mb-3">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm text-blue-600 hover:text-blue-700 underline">Retry</button>
      )}
    </div>
  );
}

export function EmptyState({ message = "No data available" }: { message?: string }) {
  return <p className="text-sm text-gray-400 text-center py-8">{message}</p>;
}
