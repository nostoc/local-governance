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
import { ArrowLeft, MapPin, Clock, ThumbsUp, ThumbsDown, ShieldCheck, Share2, CheckCircle2 } from "lucide-react";

export default function IssueDetails({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIssue() {
      const data = await getIssueById(resolvedParams.id);
      if (data) {
        setIssue(data);
      }
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
    switch(status) {
      case "Submitted": return "outline";
      case "Verified": return "secondary";
      case "In Progress": return "warning";
      case "Resolved": return "success";
      case "Closed": return "default";
      default: return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
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
    <div className="container max-w-5xl mx-auto py-12 px-4">
      <div className="mb-6">
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground mb-4 pl-0" onClick={() => router.push("/issues")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Explorer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Issue Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4 border-b bg-muted/5 rounded-t-xl">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div className="flex gap-2">
                  <Badge variant={getStatusColor(issue.status) as any}>{issue.status}</Badge>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{issue.category}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-8">
                    <Share2 className="h-4 w-4 mr-2" /> Share
                  </Button>
                </div>
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

        {/* Right Column - Status Timeline */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Immutable Audit Trail</CardTitle>
              <CardDescription>
                Track the cryptographic lifecycle of this report.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatusTimeline 
                steps={mockTimelineSteps} 
                currentStepIndex={getStepIndexByStatus(issue.status)} 
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
