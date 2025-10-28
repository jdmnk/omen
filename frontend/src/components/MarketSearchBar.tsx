"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { getBaseUrl } from "@/lib/api";
import Image from "next/image";
import { usePathname } from "next/navigation";

type Market = {
  question: string;
  icon?: string;
};

export function MarketSearchBar() {
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const pathname = usePathname();

  // Fetch selected market info when URL changes
  useEffect(() => {
    const slug = pathname?.split("/market/")[1];
    if (!slug) {
      setSelectedMarket(null);
      return;
    }

    const fetchMarket = async () => {
      try {
        const response = await fetch(
          `${getBaseUrl()}/markets/search-slug?slug=${slug}`,
          { cache: "no-store" }
        );
        const data = await response.json();
        if (data?.market) {
          setSelectedMarket(data.market);
        }
      } catch (error) {
        console.error("Failed to fetch market", error);
      }
    };

    fetchMarket();
  }, [pathname]);

  return (
    <div className="border-b bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        {/* Selected Market Display */}
        {selectedMarket ? (
          <div className="flex items-center gap-3">
            {selectedMarket.icon ? (
              <div className="w-10 h-10 relative shrink-0">
                <Image
                  src={selectedMarket.icon}
                  alt={selectedMarket.question}
                  width={40}
                  height={40}
                  className="rounded-md border object-contain w-full h-full"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-md border bg-muted/30 flex items-center justify-center shrink-0">
                <Search className="h-5 w-5 text-muted-foreground/50" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm truncate">
                {selectedMarket.question}
              </h2>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">No market selected</p>
          </div>
        )}
      </div>
    </div>
  );
}
