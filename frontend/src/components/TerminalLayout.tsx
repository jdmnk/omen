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
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 h-[calc(100vh-9rem)]">
          {/* Left Column - Market Details (Children) */}
          <div className="overflow-y-auto">{children}</div>

          {/* Right Column - Modules */}
          <div className="space-y-4 overflow-y-auto">
            {/* Placeholder for additional modules */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Watchlist</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your saved markets will appear here
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Recent trades and updates
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
