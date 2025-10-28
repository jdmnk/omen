"use client";

import { ReactNode } from "react";
import { MarketSearchBar } from "@/components/MarketSearchBar";
import { SearchBar } from "@/components/ui/search-bar";
import { LayoutGrid } from "lucide-react";
import { useRouter } from "next/navigation";

export function TerminalLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleSelectMarket = (slug: string) => {
    router.push(`/market/${slug}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Poly Insights</h1>
          </div>
          <SearchBar
            onSelectMarket={handleSelectMarket}
            placeholder="Search markets..."
            className="w-96"
          />
        </div>
      </header>

      {/* Market Info Bar */}
      <MarketSearchBar />

      {/* Trading Terminal Layout */}
      <div className="container mx-auto p-4">{children}</div>
    </div>
  );
}
