"use client";

import { useEffect, useState } from "react";
import { getPolls, voteOnPoll, type Poll } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Vote, Clock, Loader2, CheckCircle2 } from "lucide-react";

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchPolls() {
      const data = await getPolls();
      setPolls(data);
      setLoading(false);
    }
    fetchPolls();
  }, []);

  const handleVote = async (pollId: string, optionId: string) => {
    if (votedPolls.has(pollId)) return;
    setVotingId(optionId);
    
    const success = await voteOnPoll(pollId, optionId);
    if (success) {
      setPolls(polls.map(poll => {
        if (poll.id === pollId) {
          return {
            ...poll,
            totalVotes: poll.totalVotes + 1,
            options: poll.options.map(opt => 
              opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
            )
          };
        }
        return poll;
      }));
      setVotedPolls(new Set([...Array.from(votedPolls), pollId]));
    }
    setVotingId(null);
  };

  const calculatePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Civic Opinion Polling</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Participate securely in local decision-making. Blockchain polling ensures 100% transparency while protecting your anonymity.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Synchronizing ledger polls...</p>
          </div>
        </div>
      ) : polls.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border">
          <Vote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground">No active polls available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {polls.map(poll => {
            const hasVoted = votedPolls.has(poll.id);
            const isExpired = new Date(poll.endDate) < new Date();
            
            return (
              <Card key={poll.id} className="flex flex-col border-border/60 shadow-md hover:shadow-lg transition-shadow bg-card">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={isExpired ? "secondary" : "default"}>
                      {isExpired ? "Closed" : "Active"}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground font-medium">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {isExpired ? "Ended" : "Ends"} {new Date(poll.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <CardTitle className="text-2xl pt-2">{poll.title}</CardTitle>
                  <CardDescription className="text-base pt-2">{poll.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  {poll.options.map(option => {
                    const percentage = calculatePercentage(option.votes, poll.totalVotes);
                    const isVoting = votingId === option.id;
                    
                    return (
                      <div key={option.id} className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span>{option.text}</span>
                          <span className="text-muted-foreground">{percentage}% ({option.votes})</span>
                        </div>
                        <div className="relative h-10 w-full overflow-hidden rounded-md bg-muted/50 border border-border/50 group">
                          {/* Progress bar background */}
                          <div 
                            className="absolute left-0 top-0 h-full bg-primary/20 transition-all duration-1000 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                          
                          {/* Vote button overlapping */}
                          <button
                            onClick={() => handleVote(poll.id, option.id)}
                            disabled={hasVoted || isExpired || isVoting}
                            className={`absolute inset-0 flex items-center justify-center font-semibold transition-colors
                              ${hasVoted ? "cursor-default text-foreground/80" : 
                                isExpired ? "cursor-default text-muted-foreground" : 
                                "hover:bg-primary/10 text-primary opacity-0 group-hover:opacity-100"}`}
                          >
                            {isVoting ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : hasVoted ? (
                              <></>
                            ) : (
                              "Cast Vote"
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
                <CardFooter className="bg-muted/10 border-t flex justify-between rounded-b-xl py-4">
                  <span className="text-sm font-medium text-muted-foreground flex items-center">
                    <Vote className="h-4 w-4 mr-2" /> {poll.totalVotes.toLocaleString()} total votes cast
                  </span>
                  {hasVoted && (
                    <span className="text-sm font-bold text-success flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1.5" /> Voted
                    </span>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
