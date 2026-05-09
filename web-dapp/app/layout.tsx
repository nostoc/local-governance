import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { CitizenProvider } from "@/context/CitizenContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AURACHAIN | Local Governance",
  description: "Secure, decentralized, and private civic engagement for everyone.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-slate-50 flex flex-col md:flex-row`}>
        <CitizenProvider>
          {/* Mobile Top App Bar */}
          <TopAppBar className="md:hidden" />
          
          {/* Desktop Sidebar (Optional/If needed later) - For now just TopAppBar + BottomNav */}
          {/* If we want to strictly follow the prompt "Reddit-like UI... sidebar for desktop", let's make the TopAppBar act like a header and Sidebar act as navigation on desktop. */}
          
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white sticky top-0 h-screen">
            <TopAppBar className="border-b-0 shadow-none" isSidebar />
            <div className="flex-1 overflow-y-auto py-4">
              <BottomNav isSidebar />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 bg-slate-50 text-slate-900 pb-20 md:pb-0 min-h-screen overflow-x-hidden">
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          <BottomNav className="md:hidden" />
        </CitizenProvider>
      </body>
    </html>
  );
}
