import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-5 dark:bg-[#0b0d0f]">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#15181b]">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-7 w-7 text-orange-500" />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Page not found</h1>
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          This Away page does not exist.
        </p>
      </div>
    </div>
  );
}
