"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getIssues, voteFeature, type Issue } from "@/lib/api";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, MapPin, Clock, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function IssuesExplorer() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadIssues() {
      const data = await getIssues();
      setIssues(data);
      setLoading(false);
    }
    loadIssues();
  }, []);

  const handleVote = async (id: string, type: "up" | "down") => {
    const success = await voteFeature(id, type);
    if (success) {
      setIssues(issues.map(issue => {
        if (issue.id === id) {
          return {
            ...issue,
            upvotes: type === "up" ? issue.upvotes + 1 : issue.upvotes,
            downvotes: type === "down" ? issue.downvotes + 1 : issue.downvotes,
          };
        }
        return issue;
      }));
    }
  };

  const filteredIssues = issues.filter(issue => {
    const matchesFilter = filter === "All" || issue.status === filter;
    const matchesSearch = issue.title.toLowerCase().includes(search.toLowerCase()) || 
                          issue.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
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
    <div className="container mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Community Explorer</h1>
          <p className="text-muted-foreground">Browse, upvote, and track the progress of local issues reported by the community.</p>
        </div>
        <Link href="/report">
          <Button className="shadow-lg">Submit New Report</Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-card p-4 rounded-xl shadow-sm border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search issues by keyword..." 
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select 
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Verified">Verified</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Fetching ledger records...</p>
          </div>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border">
          <p className="text-muted-foreground">No issues found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIssues.map((issue) => (
            <Card key={issue.id} className="flex flex-col hover:shadow-lg transition-shadow bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3 relative">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={getStatusColor(issue.status) as any} className="mb-2">
                    {issue.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {issue.category}
                  </span>
                </div>
                <CardTitle className="text-xl line-clamp-2 leading-tight hover:text-primary transition-colors">
                  <Link href={`/issues/${issue.id}`}>
                    {issue.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pb-4">
                <div className="space-y-3">
                  <p className="text-sm text-foreground/80 line-clamp-3">
                    {issue.description}
                  </p>
                  <div className="flex flex-col gap-1.5 mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> {issue.location}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> {new Date(issue.dateSubmitted).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-border/50 flex justify-between items-center bg-muted/10 rounded-b-xl">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleVote(issue.id, "up")} className="h-8 px-2 hover:text-primary hover:bg-primary/10">
                    <ThumbsUp className="h-4 w-4 mr-1.5" />
                    <span className="font-medium text-sm">{issue.upvotes}</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleVote(issue.id, "down")} className="h-8 px-2 hover:text-destructive hover:bg-destructive/10">
                    <ThumbsDown className="h-4 w-4 mr-1.5" />
                    <span className="font-medium text-sm">{issue.downvotes}</span>
                  </Button>
                </div>
                <Link href={`/issues/${issue.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 text-primary font-medium hover:bg-primary/10">
                    View Details
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
