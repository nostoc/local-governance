"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ThumbsUp,
  Clock,
  CheckCircle2,
  Plus,
  MessageSquare,
  MoreHorizontal,
  ImageIcon,
  FileText,
  ChevronDown,
  Tent,
  Bike,
  Share2,
  Globe,
  Shield,
} from "lucide-react";

const FILTERS = ["All Issues", "Infrastructure", "Parks", "Safety"];

const SORT_OPTIONS = ["Most Recent", "Most Voted", "Oldest"];

// ── Data ──────────────────────────────────────────────────────────
const FEATURED_ISSUE = {
  id: "1",
  status: "Open",
  statusBg: "bg-blue-600",
  statusText: "text-white",
  category: "INFRASTRUCTURE",
  categoryIcon: "🏠",
  title: "Avenue Q Pothole Remediation & Smart Lighting",
  description:
    "Following the heavy storm season, Avenue Q has developed significant structural damage. This proposal see...",
  image: "/pothole_road.png",
  avatars: ["/avatar_1.png", "/avatar_2.png", "/avatar_3.png"],
  extraAvatars: 12,
  comments: 24,
};

const GRID_ISSUES = [
  {
    id: "2",
    category: "PARKS",
    categoryIcon: <Tent className="h-3 w-3" />,
    title: "Community Garden Expansion",
    description:
      "Proposal to allocate the vacant lot on 12th Street for a neighborhood-run vegetable garden.",
    image: "/community_garden.png",
    upvotes: 412,
    hasImageBadge: true,
  },
  {
    id: "3",
    category: "INFRASTRUCTURE",
    categoryIcon: <Bike className="h-3 w-3" />,
    title: "Protected Bike Lane on 3rd Ave",
    description:
      "Creation of a physical barrier between cycling lanes and vehicular traffic to reduce accidents.",
    image: "/bike_lane.png",
    upvotes: 892,
    hasImageBadge: false,
  },
];

const SIDEBAR_CARDS = [
  {
    id: "s1",
    status: "Pending Validation",
    statusBg: "bg-slate-200",
    statusText: "text-slate-700",
    category: "PARKS",
    title: "North Park Bench Restoration",
    description: "Historical wooden benches in North Park require profession...",
    progress: 68,
    progressLabel: "Validation Progress",
    action: null,
    resolved: false,
  },
  {
    id: "s2",
    status: "Resolved",
    statusBg: "bg-slate-800",
    statusText: "text-white",
    category: "SAFETY",
    title: "Crosswalk Signal Repair",
    description: "The signal on 5th and Main has been successfully replaced wi...",
    progress: null,
    progressLabel: null,
    action: "View Report",
    resolved: true,
  },
];
// ──────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const [filter, setFilter] = useState("All Issues");
  const [sort, setSort] = useState("Most Recent");

  return (
    <>
      {/* ─── MOBILE LAYOUT ─── */}
      <div className="md:hidden min-h-screen pb-24 relative">
        <div className="p-4 bg-slate-50">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Community Feed</h1>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {FILTERS.map((f) => (
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

        <div className="p-4 space-y-6">
          {/* Featured */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <div className="relative h-44">
              <img src={FEATURED_ISSUE.image} alt={FEATURED_ISSUE.title} className="w-full h-full object-cover" />
              <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold ${FEATURED_ISSUE.statusBg} ${FEATURED_ISSUE.statusText}`}>
                {FEATURED_ISSUE.status}
              </span>
            </div>
            <div className="p-4">
              <p className="text-xs text-blue-600 font-semibold mb-1">🏠 {FEATURED_ISSUE.category}</p>
              <h2 className="text-lg font-bold text-slate-900 mb-2">{FEATURED_ISSUE.title}</h2>
              <p className="text-slate-500 text-sm line-clamp-2 mb-4">{FEATURED_ISSUE.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="flex -space-x-2">
                    {FEATURED_ISSUE.avatars.map((a, i) => (
                      <img key={i} src={a} alt="" className="w-6 h-6 rounded-full border border-white object-cover" />
                    ))}
                    <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] font-bold text-slate-600">+{FEATURED_ISSUE.extraAvatars}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-slate-500"><MessageSquare className="h-3.5 w-3.5" /> {FEATURED_ISSUE.comments}</span>
                  <button className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-semibold">Support</button>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Cards */}
          {GRID_ISSUES.map((issue) => (
            <div key={issue.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
              <div className="relative h-36">
                <img src={issue.image} alt={issue.title} className="w-full h-full object-cover" />
                {issue.hasImageBadge && (
                  <div className="absolute top-2 right-2 w-7 h-7 bg-white/80 rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-slate-600" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs text-blue-600 font-semibold mb-1">{issue.category}</p>
                <h2 className="text-base font-bold text-slate-900 mb-1">{issue.title}</h2>
                <p className="text-slate-500 text-sm line-clamp-2 mb-3">{issue.description}</p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-600"><ThumbsUp className="h-4 w-4" /> {issue.upvotes}</span>
                  <Link href={`/issues/${issue.id}`} className="flex items-center gap-1 text-sm font-semibold text-blue-600">Detail →</Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/report"
          className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 hover:-translate-y-1 hover:shadow-xl transition-all z-40"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </div>

      {/* ─── DESKTOP LAYOUT ─── */}
      <div className="hidden md:flex flex-col w-full">
        <div className="flex flex-col flex-1 px-8 pt-6 pb-0">

          {/* Page Title */}
          <h1 className="text-4xl font-extrabold text-slate-900 mb-5">Community Feed</h1>

          {/* Filter bar + Sort */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                    filter === f
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <span>SORT BY:</span>
              <div className="relative flex items-center gap-1 text-blue-600 cursor-pointer select-none">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none bg-transparent pr-5 font-bold text-blue-600 focus:outline-none cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown className="h-4 w-4 pointer-events-none absolute right-0" />
              </div>
            </div>
          </div>

          {/* Main 3-column grid: [featured-left] [featured-right] [sidebar] */}
          <div className="grid grid-cols-[1fr_1fr_300px] gap-6 mb-8">

            {/* FEATURED CARD – spans 2 rows on left side (left col = image, right col = text) */}
            <div className="col-span-2 row-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-row h-[380px]">
              {/* Image */}
              <div className="relative w-[44%] shrink-0">
                <img src={FEATURED_ISSUE.image} alt={FEATURED_ISSUE.title} className="w-full h-full object-cover" />
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
                  {FEATURED_ISSUE.status}
                </span>
              </div>
              {/* Text content */}
              <div className="flex flex-col justify-between p-8 flex-1">
                <div>
                  <p className="text-xs font-bold text-blue-600 mb-3 flex items-center gap-1.5">
                    🏠 {FEATURED_ISSUE.category}
                  </p>
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-4 leading-snug">
                    {FEATURED_ISSUE.title}
                  </h2>
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
                    {FEATURED_ISSUE.description}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {FEATURED_ISSUE.avatars.map((a, i) => (
                        <img key={i} src={a} alt="" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                      ))}
                      <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                        +{FEATURED_ISSUE.extraAvatars}
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                      <MessageSquare className="h-4 w-4" /> {FEATURED_ISSUE.comments}
                    </span>
                  </div>
                  <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold transition-colors shadow-sm">
                    Support
                  </button>
                </div>
              </div>
            </div>

            {/* SIDEBAR – Right column, 2 cards stacked */}
            <div className="row-span-2 flex flex-col gap-4">
              {SIDEBAR_CARDS.map((card) => (
                <div key={card.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${card.statusBg} ${card.statusText}`}>
                      {card.status}
                    </span>
                    {card.resolved ? (
                      <CheckCircle2 className="h-5 w-5 text-slate-400" />
                    ) : (
                      <MoreHorizontal className="h-5 w-5 text-slate-400 cursor-pointer" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      🏕 {card.category}
                    </p>
                    <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">{card.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{card.description}</p>
                  </div>
                  {card.progress !== null && (
                    <div>
                      <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
                        <span>{card.progressLabel}</span>
                        <span>{card.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${card.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {card.action && (
                    <button className="w-full py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                      {card.action}
                    </button>
                  )}
                </div>
              ))}

              {/* CTA Card */}
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-5 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 mb-1">Notice something?</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Your voice is the foundation of our community. Create a new issue report or proposal today.
                  </p>
                </div>
                <Link
                  href="/report"
                  className="text-blue-600 font-bold text-sm hover:text-blue-800 transition-colors"
                >
                  Start Reporting
                </Link>
              </div>
            </div>

            {/* BOTTOM GRID – 2 cards below featured */}
            {GRID_ISSUES.map((issue) => (
              <div key={issue.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="relative h-44 shrink-0">
                  <img src={issue.image} alt={issue.title} className="w-full h-full object-cover" />
                  {issue.hasImageBadge && (
                    <div className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center shadow">
                      <ImageIcon className="h-4 w-4 text-slate-600" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Bike className="h-3 w-3" /> {issue.category}
                  </p>
                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">{issue.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed flex-1 mb-4">{issue.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                      <ThumbsUp className="h-4 w-4 text-blue-500" /> {issue.upvotes}
                    </span>
                    <Link
                      href={`/issues/${issue.id}`}
                      className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Detail <span className="text-base">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-auto px-8 py-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-4">
            <span className="font-bold text-blue-600 text-base">AuraChain</span>
            <span>© 2024 AuraChain. Decentralized Governance for the People.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Whitepaper</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Support</Link>
            <div className="flex items-center gap-3 ml-2">
              <Share2 className="h-4 w-4 hover:text-slate-900 cursor-pointer transition-colors" />
              <Globe className="h-4 w-4 hover:text-slate-900 cursor-pointer transition-colors" />
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

