"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getIssues, updateIssueStatus, type Issue } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, FileText, CheckCircle2, RotateCw, PenBox } from "lucide-react";

export default function AuthorityDashboard() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"All" | "Pending">("Pending");
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const data = await getIssues();
    setIssues(data);
    setLoading(false);
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdating(id);
    const note = newStatus === "Resolved" || newStatus === "Closed" ? resolutionNotes[id] : undefined;
    
    const success = await updateIssueStatus(id, newStatus, note);
    if (success) {
      setIssues(issues.map(i => i.id === id ? { ...i, status: newStatus as any, resolutionNote: note ?? i.resolutionNote } : i));
    }
    setUpdating(null);
  };

  const filteredIssues = issues.filter(issue => {
    if (activeTab === "Pending") return issue.status === "Submitted" || issue.status === "Verified" || issue.status === "In Progress";
    return true;
  });

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

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-primary/5 p-6 rounded-2xl border border-primary/20">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-3 rounded-full">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Authority Portal</h1>
            <p className="text-muted-foreground">Manage and verify civic reports from the blockchain network.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium px-3 py-1 bg-background rounded-full border shadow-sm">
            Node: Validator-01
          </span>
          <span className="text-sm font-medium px-3 py-1 bg-success/20 text-success rounded-full border border-success/30 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse"></span> Network Synced
          </span>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b pb-4">
        <Button 
          variant={activeTab === "Pending" ? "default" : "ghost"} 
          onClick={() => setActiveTab("Pending")}
        >
          Action Required
          {activeTab === "Pending" && <span className="ml-2 bg-primary-foreground/20 text-primary-foreground px-2 py-0.5 rounded-full text-xs">{filteredIssues.length}</span>}
        </Button>
        <Button 
          variant={activeTab === "All" ? "default" : "ghost"} 
          onClick={() => setActiveTab("All")}
        >
          All Records
        </Button>
        <Button variant="outline" size="icon" onClick={fetchData} className="ml-auto">
          <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading && issues.length === 0 ? (
        <div className="py-20 text-center">
          <RotateCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Syncing state with PoA nodes...</p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-lg font-medium text-foreground">No pending reports</p>
          <p className="text-muted-foreground">All civic reports have been addressed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredIssues.map(issue => (
            <Card key={issue.id} className="border shadow-sm flex flex-col md:flex-row overflow-hidden bg-card">
              <div className="flex-1 p-6">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">ID: {issue.id}</span>
                    <Badge variant={getStatusColor(issue.status) as any}>{issue.status}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(issue.dateSubmitted).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-xl font-bold mt-2 mb-2">
                  <Link href={`/issues/${issue.id}`} className="hover:text-primary transition-colors hover:underline">
                    {issue.title}
                  </Link>
                </h3>
                <p className="text-sm text-foreground/80 mb-4">{issue.description}</p>
                <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  <span>Category: {issue.category}</span>
                  <span>Location: {issue.location}</span>
                  <span className="text-accent flex items-center gap-1">Community Score: {issue.upvotes - issue.downvotes}</span>
                </div>
              </div>
              
              <div className="bg-muted/10 p-6 md:w-80 border-t md:border-t-0 md:border-l flex flex-col justify-center gap-4">
                <h4 className="text-sm font-semibold flex items-center gap-1.5 border-b pb-2">
                  <PenBox className="h-4 w-4" /> Official Actions
                </h4>
                
                {issue.status === "Submitted" && (
                  <Button 
                    className="w-full" 
                    disabled={updating === issue.id}
                    onClick={() => handleStatusUpdate(issue.id, "Verified")}
                  >
                    Verify Report Legitimacy
                  </Button>
                )}
                
                {issue.status === "Verified" && (
                  <Button 
                    variant="secondary" 
                    className="w-full" 
                    disabled={updating === issue.id}
                    onClick={() => handleStatusUpdate(issue.id, "In Progress")}
                  >
                    Mark as In Progress
                  </Button>
                )}
                
                {issue.status === "In Progress" && (
                  <div className="space-y-3">
                    <Input 
                      placeholder="Resolution notes... (Required)" 
                      className="text-sm bg-background"
                      value={resolutionNotes[issue.id] || ""}
                      onChange={(e) => setResolutionNotes(prev => ({ ...prev, [issue.id]: e.target.value }))}
                    />
                    <Button 
                      className="w-full bg-success text-success-foreground hover:bg-success/90" 
                      disabled={updating === issue.id || !resolutionNotes[issue.id]}
                      onClick={() => handleStatusUpdate(issue.id, "Resolved")}
                    >
                      Resolve Issue
                    </Button>
                  </div>
                )}
                
                {(issue.status === "Resolved" || issue.status === "Closed") && (
                  <div className="flex items-center justify-center p-3 bg-success/10 text-success rounded-lg border border-success/20">
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">Issue handled</span>
                  </div>
                )}
                
                {updating === issue.id && (
                  <div className="text-xs text-center text-muted-foreground animate-pulse">
                    Broadcasting to network...
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
