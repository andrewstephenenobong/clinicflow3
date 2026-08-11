import { AlertOctagon } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

// Professional error state — used whenever a query fails, instead of a
// blank page or a raw error string.
export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this data. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center text-center px-5 py-14 bg-red-50/50 border border-red-100 rounded-lg"
    >
      <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center mb-3">
        <AlertOctagon size={18} className="text-red-600" />
      </div>
      <p className="text-sm font-semibold text-red-800">{title}</p>
      <p className="text-xs text-red-600 mt-1 max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
