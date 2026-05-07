"use client";

import { useState } from "react";
import Link from "next/link";
import { ThumbsUp, Clock, CheckCircle2, Plus } from "lucide-react";

export default function FeedPage() {
  const [filter, setFilter] = useState("All Issues");

  const filters = ["All Issues", "Infrastructure", "Parks & Rec", "Safety"];

  const dummyIssues = [
    {
      id: "1",
      status: "PENDING VALIDATION",
      statusColor: "text-red-600",
      statusDot: "bg-red-600",
      statusBg: "bg-red-50",
      upvotes: 142,
      title: "Severe Pothole on Main St.",
      description: "Large sinkhole developing near the intersection of 4th and Main, causing severe damage to vehicles and traffic congestion.",
      time: "Reported 2h ago by 0x7A...3f9",
      image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800&h=400",
      resolved: false,
    },
    {
      id: "2",
      status: "OPEN",
      statusColor: "text-blue-600",
      statusDot: "bg-blue-600",
      statusBg: "bg-blue-50",
      upvotes: 89,
      title: "Broken Streetlight - Oak Ave",
      description: "The streetlight outside the community center has been out for three days, creating a safety hazard at night.",
      time: "Reported 1d ago by 0x9B...1c4",
      image: "https://images.unsplash.com/photo-1616421966961-d779cb20ed8c?auto=format&fit=crop&q=80&w=800&h=400",
      resolved: false,
    },
    {
      id: "3",
      status: "RESOLVED",
      statusColor: "text-slate-500",
      statusDot: "bg-slate-500",
      statusBg: "bg-slate-100",
      upvotes: 256,
      title: "Graffiti on Library Wall",
      description: "Offensive graffiti has been spray-painted on the east wall of the public library.",
      time: "Fixed via Proposal #104",
      image: "https://images.unsplash.com/photo-1506542270919-09f1d06b12a8?auto=format&fit=crop&q=80&w=800&h=400",
      resolved: true,
    }
  ];

  return (
    <div className="min-h-screen pb-24 relative">
      <div className="p-4 bg-white sticky top-0 z-40 border-b border-slate-100 hidden md:block">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Community Feed</h1>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f 
                  ? "bg-blue-600 text-white" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="p-4 bg-slate-50 md:hidden">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Community Feed</h1>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f 
                  ? "bg-blue-600 text-white" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {dummyIssues.map(issue => (
          <div key={issue.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${issue.statusBg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${issue.statusDot}`} />
                <span className={`text-[10px] font-bold tracking-wide ${issue.statusColor}`}>
                  {issue.status}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 text-slate-600">
                <ThumbsUp className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">{issue.upvotes}</span>
              </div>
            </div>

            <h2 className={`text-xl font-bold mb-2 ${issue.resolved ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-900'}`}>
              {issue.title}
            </h2>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed line-clamp-2">
              {issue.description}
            </p>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 font-medium">
              {issue.resolved ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span>{issue.time}</span>
            </div>

            <div className="rounded-xl overflow-hidden h-40 bg-slate-100 relative">
              <img 
                src={issue.image} 
                alt={issue.title}
                className={`w-full h-full object-cover ${issue.resolved ? 'grayscale opacity-70' : ''}`}
              />
            </div>
          </div>
        ))}
      </div>

      <Link 
        href="/report"
        className="fixed bottom-20 right-4 md:right-8 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 hover:-translate-y-1 hover:shadow-xl transition-all z-40"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
