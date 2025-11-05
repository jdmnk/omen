"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useTopHoldersWithWalletInfoQuery } from "@/lib/queries/top-holders-with-wallet-info.query";
import { TopHolder } from "@/lib/models/api.models";
import { formatNumber } from "@/lib/ui/format.utils";
import Link from "next/link";
import { Market } from "@/lib/models/api.models";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OrderBook } from "./OrderBook";
import { POLYMARKET_URL } from "@/lib/api";

function formatAddress(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function MarketHoldersWidget({
  market,
  limit = 20,
}: {
  market: Market;
  limit?: number;
}) {
  const [activeTab, setActiveTab] = useState("positions");
  const {
    data: topHolders,
    isLoading,
    error,
  } = useTopHoldersWithWalletInfoQuery(market.condition_id);

  // TopHolders already have outcomeIndex, no transformation needed
  const holdersByOutcome = (topHolders || []).reduce((acc, holder) => {
    const outcomeIndex = holder.outcomeIndex;
    if (!acc[outcomeIndex]) {
      acc[outcomeIndex] = [];
    }
    acc[outcomeIndex].push(holder);
    return acc;
  }, {} as Record<number, TopHolder[]>);

  // Sort by amount descending and take top N
  const outcome0Holders = (holdersByOutcome[0] || [])
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
  const outcome1Holders = (holdersByOutcome[1] || [])
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);

  const outcomes = market.outcomes.split(",").map((o) => o.trim());
  const outcome0Label = outcomes[0] || "YES";
  const outcome1Label = outcomes[1] || "NO";

  // Get current prices for each outcome
  const outcomePrices = market.outcomePrices
    .split(",")
    .map((p) => Number(p.trim()));
  const outcome0Price = outcomePrices[0] || 0;
  const outcome1Price = outcomePrices[1] || 0;

  const renderHolderRow = (
    holder: TopHolder,
    index: number,
    outcomeIndex: number
  ) => {
    const displayName =
      holder.name || holder.pseudonym || formatAddress(holder.proxyWallet);

    // Calculate size in USD (amount shares * current price per share)
    const currentPrice = outcomeIndex === 0 ? outcome0Price : outcome1Price;
    const sizeValue = holder.amount; // * currentPrice;

    return (
      <div
        key={`${holder.proxyWallet}-${holder.outcomeIndex}-${index}`}
        className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {holder.profileImage || holder.profileImageOptimized ? (
            <img
              src={holder.profileImageOptimized || holder.profileImage || ""}
              alt=""
              className="w-8 h-8 rounded-full shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <Link
            href={`${POLYMARKET_URL}/profile/${holder.proxyWallet}`}
            // href={`/user/${holder.proxyWallet}`}
            target="_blank"
            className="text-sm font-medium truncate hover:underline min-w-0"
          >
            {displayName}
          </Link>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold">{formatNumber(sizeValue)}</div>
        </div>
        <div className="w-16 text-right text-sm text-muted-foreground">
          {/* PnL not available in Polymarket API response */}
        </div>
        <div className="w-16">
          {/* Tags placeholder - will be added later */}
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-md pt-3">
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="positions">1 POSITIONS</TabsTrigger>
            <TabsTrigger value="rules">2 RULES</TabsTrigger>
            <TabsTrigger value="book">3 BOOK</TabsTrigger>
            <TabsTrigger value="news" disabled>
              4 NEWS
            </TabsTrigger>
            <TabsTrigger value="trades" disabled>
              5 LIVE TRADES
            </TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner message="Loading holders..." size="sm" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive text-sm">
                Error loading holders
              </div>
            ) : outcome0Holders.length === 0 && outcome1Holders.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No holder data
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {/* Outcome 0 Column */}
                <div className="flex flex-col">
                  <div className="text-sm font-semibold mb-3 pb-2 border-b border-border">
                    {outcome0Label} Trader
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2 pb-1 border-b border-border/50">
                    <div className="flex-1">Trader</div>
                    <div className="text-right">~Size</div>
                    <div className="w-16 text-right">~PnL</div>
                    <div className="w-16">Tags</div>
                  </div>
                  <div className="space-y-0">
                    {outcome0Holders.length === 0 ? (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        No holders
                      </div>
                    ) : (
                      outcome0Holders.map((holder, index) =>
                        renderHolderRow(holder, index, 0)
                      )
                    )}
                  </div>
                </div>

                {/* Outcome 1 Column */}
                <div className="flex flex-col">
                  <div className="text-sm font-semibold mb-3 pb-2 border-b border-border">
                    {outcome1Label} Trader
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2 pb-1 border-b border-border/50">
                    <div className="flex-1">Trader</div>
                    <div className="text-right">~Size</div>
                    <div className="w-16 text-right">~PnL</div>
                    <div className="w-16">Tags</div>
                  </div>
                  <div className="space-y-0">
                    {outcome1Holders.length === 0 ? (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        No holders
                      </div>
                    ) : (
                      outcome1Holders.map((holder, index) =>
                        renderHolderRow(holder, index, 1)
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rules" className="mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  Market Description
                </h3>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {market.description || "No description available."}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="book" className="mt-4">
            {activeTab === "book" && <OrderBook tokenId={market.token1} />}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
