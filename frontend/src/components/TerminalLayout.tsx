"use client";

import { useState, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketSearchBar } from "@/components/MarketSearchBar";
import { LayoutGrid } from "lucide-react";
import { useRouter } from "next/navigation";

export function TerminalLayout({ children }: { children: ReactNode }) {
  const [layoutRatio, setLayoutRatio] = useState<"1:3" | "2:3" | "1:2">("1:2");
  const router = useRouter();

  const getGridCols = () => {
    switch (layoutRatio) {
      case "1:3":
        return "md:grid-cols-[3fr_1fr]";
      case "2:3":
        return "md:grid-cols-[3fr_2fr]";
      case "1:2":
        return "md:grid-cols-[2fr_1fr]";
      default:
        return "md:grid-cols-[3fr_1fr]";
    }
  };

  const handleSelectMarket = (slug: string) => {
    router.push(`/market/${slug}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Poly Insights</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-2">Layout:</span>
            <button
              onClick={() => setLayoutRatio("1:3")}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                layoutRatio === "1:3"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              3:1
            </button>
            <button
              onClick={() => setLayoutRatio("2:3")}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                layoutRatio === "2:3"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              3:2
            </button>
            <button
              onClick={() => setLayoutRatio("1:2")}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                layoutRatio === "1:2"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              2:1
            </button>
          </div>
        </div>
      </header>

      {/* Market Search Bar */}
      <MarketSearchBar onSelectMarket={handleSelectMarket} />

      {/* Trading Terminal Layout */}
      <div className="container mx-auto p-4">
        <div
          className={`grid grid-cols-1 ${getGridCols()} gap-4 h-[calc(100vh-9rem)]`}
        >
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
