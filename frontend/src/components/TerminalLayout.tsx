"use client";

import { ReactNode } from "react";
import { SearchBar } from "@/components/ui/search-bar";
import { LayoutGrid } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function TerminalLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleSelectMarket = (slug: string) => {
    router.push(`/market/${slug}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            <Link href="/">
              <h1 className="text-lg font-bold">Poly Insights</h1>
            </Link>
          </div>
          <SearchBar
            onSelectMarket={handleSelectMarket}
            placeholder="Search markets..."
            className="w-96"
          />
        </div>
      </header>

      {children}
    </div>
  );
}
