import Link from "next/link";
import { Shield, User } from "lucide-react";

export function TopAppBar({ className = "", isSidebar = false }: { className?: string; isSidebar?: boolean }) {
  return (
    <header className={`flex items-center justify-between p-4 bg-white shadow-sm border-b border-slate-100 z-50 ${className}`}>
      <Link href="/" className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-blue-600" />
        <span className="font-bold text-lg text-blue-600 tracking-tight">AURACHAIN</span>
      </Link>
      {!isSidebar && (
        <div className="flex items-center gap-4">
          <Link href="/auth">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
              <User className="h-4 w-4" />
            </div>
          </Link>
        </div>
      )}
    </header>
  );
}
