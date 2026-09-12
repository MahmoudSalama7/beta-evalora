import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 text-center space-y-5 shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <FileQuestion className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">404 - Page Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The page or report you are looking for does not exist or has been relocated.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Return to Jobs Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
