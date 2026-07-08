import { useEffect } from "react";
import { Link } from "../router";
import { Home } from "lucide-react";

export function NotFoundPage() {
  useEffect(() => {
    document.title = "SimCo Intel - Not Found";
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-3xl flex items-center justify-center mb-6">
        <span className="text-4xl font-bold text-surface-300 dark:text-surface-600">404</span>
      </div>
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Page not found</h1>
      <p className="text-sm text-surface-500 mb-8">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-sm">
        <Home size={16} /> Back to Dashboard
      </Link>
    </div>
  );
}
