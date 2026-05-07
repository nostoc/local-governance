import { Issue, mockIssues, Poll, mockPolls } from "./mockData";

export type { Issue, Poll };

// Simulated network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getIssues(): Promise<Issue[]> {
  await delay(800);
  return [...mockIssues];
}

export async function getIssueById(id: string): Promise<Issue | undefined> {
  await delay(500);
  return mockIssues.find(issue => issue.id === id);
}

export async function submitIssue(data: Omit<Issue, "id" | "dateSubmitted" | "status" | "upvotes" | "downvotes">): Promise<Issue> {
  await delay(1500); // Simulate blockchain transaction + AI moderation latency
  
  const newIssue: Issue = {
    ...data,
    id: `iss-${Math.floor(Math.random() * 10000)}`,
    dateSubmitted: new Date().toISOString(),
    status: "Submitted",
    upvotes: 0,
    downvotes: 0,
  };
  
  mockIssues.unshift(newIssue);
  return newIssue;
}

export async function voteFeature(issueId: string, type: "up" | "down"): Promise<boolean> {
  await delay(600);
  
  const issue = mockIssues.find(i => i.id === issueId);
  if (issue) {
    if (type === "up") issue.upvotes += 1;
    else issue.downvotes += 1;
    return true;
  }
  return false;
}

export async function updateIssueStatus(issueId: string, newStatus: string, resolutionNote?: string): Promise<boolean> {
  await delay(1000); // Simulate blockchain transaction latency for officials
  const issue = mockIssues.find(i => i.id === issueId);
  if (issue) {
    issue.status = newStatus as any;
    if (resolutionNote) {
      issue.resolutionNote = resolutionNote;
    }
    return true;
  }
  return false;
}

export async function getPolls(): Promise<Poll[]> {
  await delay(700);
  return [...mockPolls];
}

export async function voteOnPoll(pollId: string, optionId: string): Promise<boolean> {
  await delay(1200); // Simulate smart contract interaction
  
  const poll = mockPolls.find(p => p.id === pollId);
  if (poll) {
    const option = poll.options.find(o => o.id === optionId);
    if (option) {
      option.votes += 1;
      poll.totalVotes += 1;
      return true;
    }
  }
  return false;
}
