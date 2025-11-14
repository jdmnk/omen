"use client";

import React, { useState } from "react";
import { useRecentTradesQuery } from "@/lib/queries/recent-trades.query";
import { LoadingSpinner } from "@/components/ui/spinner";
import { formatCompactCurrency, formatNumber } from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Trade } from "@/lib/models/api.models";
import { Button } from "@/components/ui/button";

const TRADE_ROW_GRID_CLASSES =
  "grid grid-cols-[minmax(300px,2fr)_minmax(80px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)] items-center gap-4";

function TradeRow({ trade }: { trade: Trade }) {
  const size = trade.size || 0;
  const price = trade.price || 0;
  const amount = size * price;

  const sideColor =
    trade.side === "BUY" ? "text-outcome-yes" : "text-outcome-no";

  return (
    <div
      className={cn(
        TRADE_ROW_GRID_CLASSES,
        "py-3 border-b border-border/50 last:border-0 text-sm hover:bg-muted/20"
      )}
    >
      <div className="min-w-0 overflow-hidden">
        <Link
          href={`/market/${trade.slug}`}
          className="block truncate hover:underline font-medium"
        >
          {trade.title}
        </Link>
        <div className="text-xs text-muted-foreground mt-0.5">
          {trade.outcome}
        </div>
      </div>
      <div className={cn("font-semibold", sideColor)}>{trade.side}</div>
      <div>
        <div className="font-semibold">{formatNumber(size, 0)}</div>
        <div className="text-xs text-muted-foreground">shares</div>
      </div>
      <div>
        <div className="font-semibold">{formatNumber(price * 100, 1)}%</div>
      </div>
      <div>
        <div className="font-semibold">{formatCompactCurrency(amount)}</div>
      </div>
    </div>
  );
}

export function UserTopTrades({ userId }: { userId: string }) {
  const [limit, setLimit] = useState(50);
  const {
    data: trades,
    isLoading,
    error,
  } = useRecentTradesQuery(undefined, undefined, userId, limit);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner message="Loading trades..." size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive text-sm">
        Error loading trades
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No trades found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-4 py-3 bg-muted/20 sticky top-0 z-10">
        <div className={cn(TRADE_ROW_GRID_CLASSES, "text-xs font-bold")}>
          <div>Market</div>
          <div>Side</div>
          <div>Size</div>
          <div>Price</div>
          <div>Amount</div>
        </div>
      </div>
      <div className="px-4">
        {trades.map((trade, index) => (
          <TradeRow key={`${trade.transactionHash}-${index}`} trade={trade} />
        ))}
      </div>
      {trades.length === limit && (
        <div className="flex items-center justify-center py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLimit((prev) => prev + 50)}
          >
            Load More
          </Button>
        </div>
      )}
      {trades.length < limit && trades.length > 0 && (
        <div className="text-center py-4 text-xs text-muted-foreground">
          All {trades.length} trades loaded
        </div>
      )}
    </div>
  );
}
