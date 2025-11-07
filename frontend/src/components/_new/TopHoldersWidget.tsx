"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useTopHoldersQuery } from "@/lib/queries/top-holders.query";
import { TopHolder } from "@/lib/models/api.models";
import {
  formatCompactCurrency,
  formatCompactNumber,
} from "@/lib/ui/format.utils";
import Link from "next/link";
import { Market } from "@/lib/models/api.models";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OrderBook } from "./OrderBook";
import { useOrderbookQuery } from "@/lib/queries/orderbook.query";
import { POLYMARKET_URL } from "@/lib/api";
import { useTopHoldersPositionsQuery } from "@/lib/queries/top-holders-positions.query";
import { generateHolderTagsMap } from "@/lib/utils/holder-tags.utils";
import type { HolderTagIcon } from "@/lib/utils/holder-tags.utils";
import { formatAddress } from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import { Command } from "lucide-react";
import {
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import Image from "next/image";

const HOLDER_ROW_GRID_CLASSES =
  "grid grid-cols-[24px_auto_2.5rem_6rem_4.5rem] items-center gap-3";

function HolderTagIcon({ icon }: { icon: HolderTagIcon }) {
  const iconPath = `/icons/${icon}.svg`;
  return <img src={iconPath} alt="" className="w-4 h-4" />;
}

function TabItemContent({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Command className="w-2 h-2" />
      <span>{label}</span>
    </div>
  );
}

function OutcomeColumn({
  label,
  bgColor,
  holders,
  renderHolderRow,
  outcomeIndex,
}: {
  label: string;
  bgColor: string;
  holders: TopHolder[];
  renderHolderRow: (
    holder: TopHolder,
    index: number,
    outcomeIndex: number
  ) => React.ReactElement;
  outcomeIndex: number;
}) {
  return (
    <div className={cn("flex flex-col px-3 py-3", bgColor)}>
      <div
        className={cn(
          HOLDER_ROW_GRID_CLASSES,
          "text-xs text-brand-foreground font-bold"
        )}
      >
        <div className="text-center">{label.toUpperCase()}</div>
        <div className="">Trader</div>
        <div className="">~Size</div>
        <div className="">~PnL</div>
        <div className="">Tags</div>
      </div>
      <div className="space-y-0">
        {holders.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No holders
          </div>
        ) : (
          holders.map((holder, index) =>
            renderHolderRow(holder, index, outcomeIndex)
          )
        )}
      </div>
    </div>
  );
}

export function TopHoldersWidget({
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
  } = useTopHoldersQuery(market.condition_id, market.token1, market.token2);

  const { data: topHoldersPositions } = useTopHoldersPositionsQuery(
    topHolders?.map((h) => h.proxyWallet),
    100
  );

  // Fetch orderbook to get live prices for PnL calculation
  const { data: orderbookData } = useOrderbookQuery(market.token1);

  // Generate tags for all holders
  const holderTagsMap = useMemo(() => {
    if (!topHolders) return {};
    return generateHolderTagsMap(
      topHolders,
      topHoldersPositions,
      market.token1
    );
  }, [topHolders, topHoldersPositions, market.token1]);

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
  // Use orderbook midpoint if available, otherwise fallback to market outcomePrices
  const outcomePrices = market.outcomePrices
    .split(",")
    .map((p) => Number(p.trim()));

  // If orderbook available, use midpoint for YES (outcome 0) and (1 - midpoint) for NO (outcome 1)
  // Otherwise use market prices
  const outcome0Price = orderbookData?.midpointPrice
    ? orderbookData.midpointPrice
    : outcomePrices[0] || 0;
  const outcome1Price = orderbookData?.midpointPrice
    ? 1 - orderbookData.midpointPrice
    : outcomePrices[1] || 0;

  const renderHolderRow = (
    holder: TopHolder,
    index: number,
    outcomeIndex: number
  ) => {
    const displayName =
      holder.name || holder.pseudonym || formatAddress(holder.proxyWallet);

    // Calculate size in USD (amount shares * current price per share)
    const currentPrice = outcomeIndex === 0 ? outcome0Price : outcome1Price;
    const sharesAmount = holder.amount.toFixed(0);

    // Calculate PnL using live orderbook prices and avgPrice from backend
    // Unrealized PnL = (currentPrice - avgPrice) * amount
    // We also have realizedPnl from backend, but unrealized is more relevant for live display
    let pnl: number | null = null;
    let pnlPercent: number | null = null;

    if (
      holder.avgPrice !== null &&
      holder.avgPrice !== undefined &&
      holder.avgPrice > 0
    ) {
      // Calculate unrealized PnL
      const costBasis = holder.avgPrice * holder.amount;
      const currentValue = currentPrice * holder.amount;
      pnl = currentValue - costBasis;
      pnlPercent = ((currentPrice - holder.avgPrice) / holder.avgPrice) * 100;
    }

    const pnlColor =
      pnl !== null
        ? pnl > 0
          ? "text-outcome-yes"
          : pnl < 0
          ? "text-outcome-no"
          : "text-muted-foreground"
        : "text-muted-foreground";

    return (
      <div
        key={`${holder.proxyWallet}-${holder.outcomeIndex}-${index}`}
        className={cn(
          HOLDER_ROW_GRID_CLASSES,
          "py-2 border-b border-border/50 last:border-0 text-xs"
        )}
      >
        <div className="flex items-center justify-center">
          {holder.profileImageOptimized || holder.profileImage ? (
            <Image
              src={holder.profileImageOptimized || holder.profileImage || ""}
              alt=""
              width={24}
              height={24}
              className="w-6 h-6 rounded-full shrink-0 object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 overflow-hidden">
          <Link
            href={`${POLYMARKET_URL}/profile/${holder.proxyWallet}`}
            // href={`/user/${holder.proxyWallet}`}
            target="_blank"
            className="block truncate hover:underline"
          >
            {displayName}
          </Link>
        </div>
        <div className="">
          <div className="font-semibold">
            {formatCompactNumber(+sharesAmount, 1)}
          </div>
        </div>
        <div className="">
          {pnl !== null ? (
            <div className={cn("flex items-center gap-1", pnlColor)}>
              <div>{formatCompactCurrency(pnl, 1)}</div>
              {pnlPercent !== null && (
                <div className="text-xs opacity-75">
                  {pnlPercent > 0 ? "+" : ""}
                  {pnlPercent.toFixed(1)}%
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground">-</div>
          )}
        </div>
        <div>
          <div className="flex gap-1">
            {holderTagsMap[holder.proxyWallet]?.map((tag, tagIndex) => {
              return (
                <TooltipPrimitive.Root key={tagIndex}>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <HolderTagIcon icon={tag.icon} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tag.label}</p>
                  </TooltipContent>
                </TooltipPrimitive.Root>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="px-3 pt-2">
            <TabsTrigger value="positions">
              <TabItemContent label="1 POSITIONS" />
            </TabsTrigger>
            <TabsTrigger value="rules">
              <TabItemContent label="2 RULES" />
            </TabsTrigger>
            <TabsTrigger value="book">
              <TabItemContent label="3 BOOK" />
            </TabsTrigger>
            <TabsTrigger value="news" disabled>
              <TabItemContent label="4 NEWS" />
            </TabsTrigger>
            <TabsTrigger value="trades" disabled>
              <TabItemContent label="5 LIVE TRADES" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="positions">
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
              <div className="grid grid-cols-2">
                <OutcomeColumn
                  label={outcome0Label}
                  bgColor="bg-outcome-yes-muted"
                  holders={outcome0Holders}
                  renderHolderRow={renderHolderRow}
                  outcomeIndex={0}
                />
                <OutcomeColumn
                  label={outcome1Label}
                  bgColor="bg-outcome-no-muted"
                  holders={outcome1Holders}
                  renderHolderRow={renderHolderRow}
                  outcomeIndex={1}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="rules">
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

          <TabsContent value="book">
            {activeTab === "book" && <OrderBook tokenId={market.token1} />}
          </TabsContent>
        </Tabs>
      </Card>
    </TooltipProvider>
  );
}
