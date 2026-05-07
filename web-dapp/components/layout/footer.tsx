import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40 text-muted-foreground py-12">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 col-span-1 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <span className="text-lg font-bold text-foreground">
                CivicChain
              </span>
            </div>
            <p className="text-sm">
              Blockchain-based community-assisted privacy-preserving reporting service for local governance. Ensuring transparency, anonymity, and trust.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/issues" className="hover:text-primary transition-colors">Explorer</Link></li>
              <li><Link href="/report" className="hover:text-primary transition-colors">Submit Report</Link></li>
              <li><Link href="/polls" className="hover:text-primary transition-colors">Active Polls</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal & Privacy</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Anonymity Guarantees</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center text-xs">
          <p>© {new Date().getFullYear()} CivicChain. Open Source Prototype.</p>
          <div className="mt-4 md:mt-0 space-x-4">
            <span>Powered by Permissioned Blockchain</span>
            <span>IPFS Storage</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
