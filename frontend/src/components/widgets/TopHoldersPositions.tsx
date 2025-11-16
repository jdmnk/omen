"use client";

import React, { useMemo } from "react";
import { Spinner, LoadingSpinner } from "@/components/ui/spinner";
import { useTopHoldersQuery } from "@/lib/queries/top-holders.query";
import {
  useTopHoldersPnlQuery,
  type TopHolderPnl,
} from "@/lib/queries/top-holders-pnl.query";
import {
  useTopHoldersWalletInfoQuery,
  type TopHolderWalletInfo,
} from "@/lib/queries/top-holders-wallet-info.query";
import {
  formatCompactCurrency,
  formatCompactNumber,
  formatNumber,
} from "@/lib/ui/format.utils";
import Link from "next/link";
import { Market, TopHolderAnalysis } from "@/lib/models/api.models";
import { useOrderbookQuery } from "@/lib/queries/orderbook.query";
import { POLYMARKET_URL } from "@/lib/api.const";
import { useTopHoldersPositionsQuery } from "@/lib/queries/top-holders-positions.query";
import { generateHolderTagsMap } from "@/lib/utils/holder-tags.utils";
import type { HolderTagIcon } from "@/lib/utils/holder-tags.utils";
import { formatAddress } from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import {
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import Image from "next/image";

const HOLDER_ROW_GRID_CLASSES =
  // "grid grid-cols-[24px_auto_3rem_6.5rem_4.5rem] items-center gap-3";
  "grid grid-cols-[24px_2.5fr_minmax(3rem,1fr)_minmax(6.5rem,2fr)_minmax(4.5rem,1.5fr)] items-center gap-3";

function HolderTagIcon({ icon }: { icon: HolderTagIcon }) {
  const iconPath = `/icons/${icon}.svg`;
  return <img src={iconPath} alt={icon} className="w-4 h-4" />;
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
  holders: TopHolderAnalysis[];
  renderHolderRow: (
    holder: TopHolderAnalysis,
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

export function TopHoldersPositions({
  market,
  limit = 20,
}: {
  market: Market;
  limit?: number;
}) {
  // Step 1: Fetch top holders directly from Polymarket API
  const {
    data: rawHolders,
    isLoading: isLoadingHolders,
    error: holdersError,
  } = useTopHoldersQuery(market.conditionId);

  // Step 2a: Get PnL data for holders
  const { data: pnlHolders, isLoading: isLoadingPnl } = useTopHoldersPnlQuery(
    rawHolders,
    market.token1,
    market.token2
  );

  // Step 2b: Get wallet info for holders
  const { data: walletInfoHolders, isLoading: isLoadingWalletInfo } =
    useTopHoldersWalletInfoQuery(rawHolders, true); // disable for now, unused

  // Merge raw holders with PnL and wallet info data
  const topHolders = useMemo(() => {
    if (!rawHolders) return undefined;

    // Create maps for quick lookup
    const pnlMap = new Map<string, TopHolderPnl>();
    if (pnlHolders) {
      pnlHolders.forEach((holder) => {
        const key = `${holder.proxyWallet}-${holder.outcomeIndex}`;
        pnlMap.set(key, holder);
      });
    }

    const walletMap = new Map<string, TopHolderWalletInfo>();
    if (walletInfoHolders) {
      walletInfoHolders.forEach((holder) => {
        const key = `${holder.proxyWallet}-${holder.outcomeIndex}`;
        walletMap.set(key, holder);
      });
    }

    // Merge data
    return rawHolders.map((rawHolder) => {
      const key = `${rawHolder.proxyWallet}-${rawHolder.outcomeIndex}`;
      const pnlData = pnlMap.get(key);
      const walletData = walletMap.get(key);

      return {
        ...rawHolder,
        ...(pnlData && {
          avgPrice: pnlData.avgPrice,
          realizedPnl: pnlData.realizedPnl,
          totalBought: pnlData.totalBought,
        }),
        ...(walletData && {
          walletCreatedAt: walletData.walletCreatedAt,
          walletLastTransfer: walletData.walletLastTransfer,
          walletBalance: walletData.walletBalance,
        }),
      } as TopHolderAnalysis;
    });
  }, [rawHolders, pnlHolders, walletInfoHolders]);

  const isLoading = isLoadingHolders;
  const isLoadingEnrichment = isLoadingPnl || isLoadingWalletInfo;
  const error = holdersError;

  const { data: topHoldersPositions } = useTopHoldersPositionsQuery(
    topHolders?.map((h) => h.proxyWallet),
    100
  );

  // Fetch orderbook to get live prices for PnL calculation
  const { data: orderbookData } = useOrderbookQuery(market.token1);

  // Generate tags for all holders (only works with enriched holders)
  const holderTagsMap = useMemo(() => {
    if (!pnlHolders || !walletInfoHolders) return {};
    // Create merged holders for tag generation
    const mergedForTags =
      rawHolders?.map((raw) => {
        const key = `${raw.proxyWallet}-${raw.outcomeIndex}`;
        const pnl = pnlHolders.find(
          (h) => `${h.proxyWallet}-${h.outcomeIndex}` === key
        );
        const wallet = walletInfoHolders.find(
          (h) => `${h.proxyWallet}-${h.outcomeIndex}` === key
        );
        return {
          ...raw,
          ...(pnl && {
            avgPrice: pnl.avgPrice,
            realizedPnl: pnl.realizedPnl,
            totalBought: pnl.totalBought,
          }),
          ...(wallet && {
            walletCreatedAt: wallet.walletCreatedAt,
            walletLastTransfer: wallet.walletLastTransfer,
            walletBalance: wallet.walletBalance,
          }),
        } as TopHolderAnalysis;
      }) || [];
    return generateHolderTagsMap(
      mergedForTags,
      topHoldersPositions,
      market.token1
    );
  }, [
    pnlHolders,
    walletInfoHolders,
    rawHolders,
    topHoldersPositions,
    market.token1,
  ]);

  // TopHolders already have outcomeIndex, no transformation needed
  const holdersByOutcome = (topHolders || []).reduce((acc, holder) => {
    const outcomeIndex = holder.outcomeIndex;
    if (!acc[outcomeIndex]) {
      acc[outcomeIndex] = [];
    }
    acc[outcomeIndex].push(holder);
    return acc;
  }, {} as Record<number, TopHolderAnalysis[]>);

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
    holder: TopHolderAnalysis,
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

    // Check if enrichment is still loading for this holder
    const isEnrichmentLoading =
      isLoadingEnrichment && (!pnlHolders || !walletInfoHolders);
    const hasTags =
      holderTagsMap[holder.proxyWallet] &&
      holderTagsMap[holder.proxyWallet].length > 0;

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
            <div className="relative w-6 h-6 shrink-0">
              <Image
                src={holder.profileImageOptimized || holder.profileImage || ""}
                alt=""
                width={24}
                height={24}
                className="w-6 h-6 rounded-full object-cover opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-muted/40 text-xs font-medium">
                {index + 1}
              </div>
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
              {index + 1}
            </div>
          )}
        </div>
        <div className="min-w-0 overflow-hidden">
          <Link
            // href={`${POLYMARKET_URL}/profile/${holder.proxyWallet}`}
            href={`/user/${holder.proxyWallet}`}
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
                  {formatNumber(pnlPercent, 1)}%
                </div>
              )}
            </div>
          ) : isEnrichmentLoading ? (
            <div className="flex items-center">
              <Spinner size="sm" />
            </div>
          ) : (
            <div className="text-muted-foreground">-</div>
          )}
        </div>
        <div>
          <div className="flex gap-1">
            {isEnrichmentLoading && !hasTags ? (
              <Spinner size="sm" />
            ) : (
              holderTagsMap[holder.proxyWallet]?.map((tag, tagIndex) => {
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
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner message="Loading holders..." size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive text-sm">
        Error loading holders
      </div>
    );
  }

  if (outcome0Holders.length === 0 && outcome1Holders.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        No holder data
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="grid grid-cols-2">
        <OutcomeColumn
          label={outcome0Label}
          bgColor=""
          holders={outcome0Holders}
          renderHolderRow={renderHolderRow}
          outcomeIndex={0}
        />
        <OutcomeColumn
          label={outcome1Label}
          bgColor=""
          holders={outcome1Holders}
          renderHolderRow={renderHolderRow}
          outcomeIndex={1}
        />
      </div>
    </TooltipProvider>
  );
}
