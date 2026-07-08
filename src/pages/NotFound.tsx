import { useEffect } from "react";
import { Link } from "../router";

export function NotFoundPage() {
  useEffect(() => {
    document.title = "SimCo Intel - Not Found";
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
      <p className="text-lg text-gray-600 mb-6">Page not found</p>
      <Link to="/" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
        Back to Dashboard
      </Link>
    </div>
  );
}
