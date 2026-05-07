"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, MapPin, Lock, LocateFixed, CheckCircle2 } from "lucide-react";

export default function ReportPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate submission delay
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/feed");
      }, 3000);
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-4 py-8 animate-in zoom-in duration-500">
        <div className="bg-green-50 text-green-600 rounded-full p-6 mb-6">
          <CheckCircle2 className="h-16 w-16" />
        </div>
        <h2 className="text-3xl font-bold mb-4 text-center text-slate-900">Report Submitted</h2>
        <p className="text-slate-500 text-center mb-8 max-w-sm">
          Your report has passed AI moderation and was successfully anchored to the blockchain.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-8 md:pt-12">
      <div className="max-w-xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
          Create New Report
        </h1>
        <p className="text-slate-500 mb-8">
          Securely submit an incident or observation to the public ledger.
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
          
          {/* Step 1 */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-900 mb-3">
              Step 1: What's the issue?
            </label>
            <textarea
              rows={4}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-none transition-all"
              placeholder="Describe the situation clearly and objectively..."
            />
          </div>

          {/* Step 2 */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-900 mb-3">
              Step 2: Add Proof
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors group">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 mb-3 group-hover:text-blue-600 shadow-sm border border-slate-100 transition-colors">
                <Camera className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Upload Photo/Video</span>
              <span className="text-xs text-slate-400 mt-1 font-medium">Supports JPG, PNG, MP4</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="mb-10">
            <label className="block text-sm font-bold text-slate-900 mb-3">
              Step 3: Location
            </label>
            <div className="relative h-48 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800&h=400" 
                alt="Map"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                    <MapPin className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <button 
                type="button"
                className="absolute bottom-4 left-4 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <LocateFixed className="h-3.5 w-3.5 text-blue-600" />
                Current Location
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Lock className="h-5 w-5" />
            )}
            <span>{isSubmitting ? "Submitting..." : "Submit Anonymously"}</span>
          </button>
          
          <p className="text-center text-xs font-medium text-slate-400 mt-4">
            Your identity is cryptographically protected.
          </p>

        </form>
      </div>
    </div>
  );
}
