import Link from "next/link";
import { Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-4">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -z-10" />
      
      <div className="mb-12 relative flex items-center justify-center">
        <div className="absolute w-32 h-32 bg-blue-100 rounded-full animate-pulse" />
        <div className="absolute w-24 h-24 bg-blue-200 rounded-full" />
        <div className="relative w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <div className="w-8 h-8 rounded-full border-2 border-white/80" />
        </div>
      </div>

      <div className="text-center max-w-sm mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
          Your City, Your<br />Voice. Protected.
        </h1>
        <p className="text-slate-500">
          Secure, decentralized, and private civic engagement for everyone.
        </p>
      </div>

      <div className="flex flex-col items-center w-full max-w-xs gap-6">
        <Link href="/auth" className="w-full">
          <button className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm transition-colors text-center">
            Get Started
          </button>
        </Link>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">
          <Shield className="h-3 w-3" />
          <span>Privacy-first with Zero-Knowledge Proofs</span>
        </div>
      </div>
    </div>
  );
}
