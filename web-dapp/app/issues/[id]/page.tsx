"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getIssueById, voteFeature, type Issue } from "@/lib/api";
import { mockTimelineSteps, getStepIndexByStatus } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusTimeline } from "@/components/ui/timeline";
import {
  ArrowLeft, MapPin, Clock, ThumbsUp, ThumbsDown, ShieldCheck, Share2, CheckCircle2,
  ArrowLeftIcon, Bell, Settings, Landmark, Globe,
} from "lucide-react";

// ── Static demo data used only on desktop ───────────────────────
const DEMO_REPORT = {
  id: "AC-78421",
  status: "Active Review",
  title: "Severe Road Subsidence on 4th Ave",
  reportedAt: "Oct 24, 2024 • 14:30 GMT",
  heroImage: "/road_subsidence.png",
  mapImage: "/map_satellite.png",
  coordinates: "47.6062° N, 122.3321° W",
  consensusPct: 68,
  tokensVoted: 1428,
  authority: "Department of Transit",
  authorityNote: "Awaiting consensus threshold of 75% for automated repair dispatch.",
  description: [
    "A significant road subsidence event has been observed on 4th Avenue near the intersection with Oak Street. The depression is approximately 1.5 meters wide and 0.5 meters deep, posing a severe threat to vehicle safety and local traffic flow. Preliminary inspection suggests a potential water main leak or soil erosion beneath the asphalt layer.",
    "The surrounding pavement shows signs of structural failure with radial cracking extending 3 meters from the epicenter. Local residents have reported increased vibration and hollow sounds when heavy vehicles pass over this section during the last 48 hours. Immediate cordoning and forensic engineering assessment are recommended.",
  ],
};

export default function IssueDetails({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState<"legitimate" | "spam" | null>(null);

  useEffect(() => {
    async function fetchIssue() {
      const data = await getIssueById(resolvedParams.id);
      if (data) setIssue(data);
      setLoading(false);
    }
    fetchIssue();
  }, [resolvedParams.id]);

  const handleVote = async (type: "up" | "down") => {
    if (!issue) return;
    const success = await voteFeature(issue.id, type);
    if (success) {
      setIssue({
        ...issue,
        upvotes: type === "up" ? issue.upvotes + 1 : issue.upvotes,
        downvotes: type === "down" ? issue.downvotes + 1 : issue.downvotes,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Submitted": return "outline";
      case "Verified": return "secondary";
      case "In Progress": return "warning";
      case "Resolved": return "success";
      case "Closed": return "default";
      default: return "outline";
    }
  };

  /* ─── Loading / not found states (shared) ─── */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Retrieving block payload...</p>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Record Not Found</h2>
        <p className="text-muted-foreground mb-6">The requested issue could not be found on the ledger.</p>
        <Button onClick={() => router.push("/issues")}>Return to Explorer</Button>
      </div>
    );
  }

  return (
    <>
      {/* ─── MOBILE LAYOUT (unchanged) ─── */}
      <div className="md:hidden container max-w-5xl mx-auto py-12 px-4">
        <div className="mb-6">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground mb-4 pl-0" onClick={() => router.push("/issues")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Explorer
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-4 border-b bg-muted/5 rounded-t-xl">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                  <div className="flex gap-2">
                    <Badge variant={getStatusColor(issue.status) as any}>{issue.status}</Badge>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{issue.category}</span>
                  </div>
                  <Button variant="outline" size="sm" className="h-8">
                    <Share2 className="h-4 w-4 mr-2" /> Share
                  </Button>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-extrabold leading-tight">{issue.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {issue.location}</span>
                  <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Submitted {new Date(issue.dateSubmitted).toLocaleString()}</span>
                  <span className="flex items-center gap-1.5 font-mono text-xs"><ShieldCheck className="h-4 w-4" /> Block ID: {issue.id}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{issue.description}</p>
                  {issue.imageUrl && (
                    <div className="mt-8 rounded-xl overflow-hidden border">
                      <img src={issue.imageUrl} alt="Issue evidence" className="w-full h-auto object-cover max-h-[400px]" />
                      <div className="bg-muted p-2 text-xs text-center text-muted-foreground border-t">
                        Cryptographically verified media via IPFS
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-8 flex items-center justify-between border-t pt-6">
                  <div className="text-sm font-medium">Community Agreement</div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => handleVote("up")} className="hover:bg-primary/10 hover:text-primary hover:border-primary/50">
                      <ThumbsUp className="h-4 w-4 mr-2" /> {issue.upvotes}
                    </Button>
                    <Button variant="outline" onClick={() => handleVote("down")} className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50">
                      <ThumbsDown className="h-4 w-4 mr-2" /> {issue.downvotes}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {issue.resolutionNote && (
              <Card className="border-success/30 bg-success/5 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-success">
                    <CheckCircle2 className="h-5 w-5" /> Official Resolution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/90">{issue.resolutionNote}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-border shadow-sm sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Immutable Audit Trail</CardTitle>
                <CardDescription>Track the cryptographic lifecycle of this report.</CardDescription>
              </CardHeader>
              <CardContent>
                <StatusTimeline steps={mockTimelineSteps} currentStepIndex={getStepIndexByStatus(issue.status)} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ─── DESKTOP LAYOUT (new) ─── */}
      <div className="hidden md:flex flex-col w-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Report Detail
          </button>
          <div className="flex items-center gap-4 text-slate-500">
            <button className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <img src="/avatar_1.png" alt="Profile" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-[1fr_300px] gap-8 px-8 pb-8">

          {/* LEFT: Main content */}
          <div className="flex flex-col gap-6">
            {/* Hero image */}
            <div className="w-full h-[340px] rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
              <img
                src={DEMO_REPORT.heroImage}
                alt={DEMO_REPORT.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Status + ID */}
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                {DEMO_REPORT.status}
              </span>
              <span className="text-slate-400 text-sm">ID: {DEMO_REPORT.id}</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">
              {DEMO_REPORT.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Clock className="h-4 w-4" />
              <span>Reported {DEMO_REPORT.reportedAt}</span>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Detailed Description</h2>
              <div className="space-y-5">
                {DEMO_REPORT.description.map((para, i) => (
                  <p key={i} className="text-slate-600 text-sm leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Sidebar */}
          <div className="flex flex-col gap-5 sticky top-0 self-start pt-0">

            {/* Map / Coordinates card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-44 relative">
                <img
                  src={DEMO_REPORT.mapImage}
                  alt="Location"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="px-4 py-3 bg-white">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Coordinates</p>
                <p className="text-sm font-bold text-slate-800">{DEMO_REPORT.coordinates}</p>
              </div>
            </div>

            {/* Democratic Voting card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-lg font-bold text-slate-900 mb-5">Democratic Voting</h3>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 font-medium">Community Consensus</span>
                  <span className="text-2xl font-extrabold text-blue-600">{DEMO_REPORT.consensusPct}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${DEMO_REPORT.consensusPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                  <span>🗳</span>
                  {DEMO_REPORT.tokensVoted.toLocaleString()} Verified Tokens Voted
                </p>
              </div>

              {/* Vote buttons */}
              <div className="flex flex-col gap-3 mt-4">
                <button
                  onClick={() => setVoted("legitimate")}
                  className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    voted === "legitimate"
                      ? "bg-blue-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  } shadow-sm`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Legitimate
                </button>
                <button
                  onClick={() => setVoted("spam")}
                  className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all ${
                    voted === "spam"
                      ? "border-red-400 bg-red-50 text-red-600"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-base leading-none">⚠</span>
                  Spam/Invalid
                </button>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-slate-400 text-center mt-4 leading-relaxed">
                Voting requires a minimum balance of 50 AURA. Gas fees are sponsored by the Municipal Protocol.
              </p>
            </div>

            {/* Authority Status card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <Landmark className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Authority Status</p>
                <p className="text-sm font-bold text-slate-900 mb-2">{DEMO_REPORT.authority}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{DEMO_REPORT.authorityNote}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex flex-col gap-1">
            <span className="font-bold text-blue-600 text-base">AuraChain</span>
            <span>© 2024 AuraChain. Decentralized Governance for the People.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Whitepaper</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Support</Link>
          </div>
        </footer>
      </div>
    </>
  );
}

