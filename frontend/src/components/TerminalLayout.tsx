"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketSearchBar } from "@/components/MarketSearchBar";
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
        <div className="container mx-auto px-4 h-14 flex items-center">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Poly Insights</h1>
          </div>
        </div>
      </header>

      {/* Market Search Bar */}
      <MarketSearchBar onSelectMarket={handleSelectMarket} />

      {/* Trading Terminal Layout */}
      <div className="container mx-auto p-4">{children}</div>
    </div>
  );
}
