export type IssueStatus = "Submitted" | "Verified" | "In Progress" | "Resolved" | "Closed";

export interface Issue {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  status: IssueStatus;
  dateSubmitted: string;
  upvotes: number;
  downvotes: number;
  imageUrl?: string;
  resolutionNote?: string;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  endDate: string;
  options: {
    id: string;
    text: string;
    votes: number;
  }[];
  totalVotes: number;
}

export const mockIssues: Issue[] = [
  {
    id: "iss-001",
    title: "Major Pothole on Main Street",
    category: "Infrastructure",
    description: "There is a deep pothole in the right lane going northbound, causing severe traffic and potential vehicle damage.",
    location: "Main St. near 4th Ave.",
    status: "In Progress",
    dateSubmitted: "2026-03-01T10:00:00Z",
    upvotes: 45,
    downvotes: 2,
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "iss-002",
    title: "Broken Streetlight",
    category: "Public Safety",
    description: "The streetlight has been out for a week, making the pedestrian crossing very dangerous at night.",
    location: "Oak St. and Elm St.",
    status: "Verified",
    dateSubmitted: "2026-03-02T19:30:00Z",
    upvotes: 12,
    downvotes: 0,
  },
  {
    id: "iss-003",
    title: "Illegal Dumping in Park",
    category: "Sanitation",
    description: "Someone dumped construction materials near the children's playground.",
    location: "Centennial Park",
    status: "Resolved",
    dateSubmitted: "2026-02-28T08:15:00Z",
    upvotes: 130,
    downvotes: 5,
    imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800",
    resolutionNote: "City sanitation department cleared the debris on March 3rd. Increased monitoring implemented.",
  },
  {
    id: "iss-004",
    title: "Overgrown Vegetation Blocking Stop Sign",
    category: "Traffic",
    description: "The stop sign at the intersection is completely obscured by overgrown trees.",
    location: "Maple Drive & 5th St.",
    status: "Submitted",
    dateSubmitted: "2026-03-04T07:45:00Z",
    upvotes: 3,
    downvotes: 0,
  }
];

export const mockPolls: Poll[] = [
  {
    id: "poll-001",
    title: "New Public Library Funding",
    description: "Should the local council allocate an additional $500k to expand the public library's digital services?",
    endDate: "2026-04-01T23:59:59Z",
    totalVotes: 1245,
    options: [
      { id: "opt-1", text: "Yes, fully fund", votes: 850 },
      { id: "opt-2", text: "Partially fund ($250k)", votes: 200 },
      { id: "opt-3", text: "No additional funding", votes: 195 },
    ]
  },
  {
    id: "poll-002",
    title: "Downtown Pedestrian Zone",
    description: "Should Main Street be closed to vehicle traffic on weekends to promote local businesses and pedestrian safety?",
    endDate: "2026-03-15T23:59:59Z",
    totalVotes: 3042,
    options: [
      { id: "opt-1", text: "Strongly Support", votes: 1800 },
      { id: "opt-2", text: "Support with restrictions (e.g., specific hours)", votes: 642 },
      { id: "opt-3", text: "Oppose", votes: 600 },
    ]
  }
];

export const mockTimelineSteps = [
  { id: "step-1", title: "Report Submitted", description: "Issue recorded on the blockchain network." },
  { id: "step-2", title: "AI Moderation Passed", description: "Content verified for appropriate use." },
  { id: "step-3", title: "Authority Verification", description: "Local authority has verified the issue." },
  { id: "step-4", title: "In Progress", description: "Work has begun to resolve the issue." },
  { id: "step-5", title: "Resolved", description: "The issue has been marked as completed." },
  { id: "step-6", title: "Community Confirmed", description: "The community has validated the resolution." }
];

export function getStepIndexByStatus(status: IssueStatus): number {
  switch(status) {
    case "Submitted": return 1;
    case "Verified": return 3;
    case "In Progress": return 4;
    case "Resolved": return 5;
    case "Closed": return 6;
    default: return 0;
  }
}
