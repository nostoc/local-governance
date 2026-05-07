import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Menu, FileText, LayoutDashboard, Vote } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            CivicChain
          </span>
        </Link>
        
        <nav className="hidden md:flex gap-6 items-center flex-1 justify-center">
          <Link href="/issues" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> Reports
          </Link>
          <Link href="/polls" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
            <Vote className="h-4 w-4" /> Polls
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
            <LayoutDashboard className="h-4 w-4" /> Authority
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/report">
            <Button variant="default" className="hidden md:inline-flex shadow-primary/20 shadow-lg">
              Report Issue
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
