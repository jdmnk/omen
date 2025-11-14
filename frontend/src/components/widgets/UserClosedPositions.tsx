"use client";

import React, { useState } from "react";
import { useClosedPositionsQuery } from "@/lib/queries/closed-positions.query";
import { LoadingSpinner } from "@/components/ui/spinner";
import { formatCompactCurrency, formatNumber } from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ClosedPosition } from "@/lib/models/frontend.models";
import { Button } from "@/components/ui/button";

const POSITION_ROW_GRID_CLASSES =
  "grid grid-cols-[minmax(300px,2fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)] items-center gap-4";

function ClosedPositionRow({ position }: { position: ClosedPosition }) {
  const totalBought = position.totalBought || 0;
  const avgPrice = position.avgPrice || 0;
  const realizedPnl = position.realizedPnl || 0;

  const pnlPercent = totalBought > 0 ? (realizedPnl / totalBought) * 100 : 0;

  const pnlColor =
    realizedPnl > 0
      ? "text-outcome-yes"
      : realizedPnl < 0
      ? "text-outcome-no"
      : "text-muted-foreground";

  return (
    <div
      className={cn(
        POSITION_ROW_GRID_CLASSES,
        "py-3 border-b border-border/50 last:border-0 text-sm hover:bg-muted/20"
      )}
    >
      <div className="min-w-0 overflow-hidden">
        <Link
          href={`/market/${position.slug}`}
          className="block truncate hover:underline font-medium"
        >
          {position.title}
        </Link>
        <div className="text-xs text-muted-foreground mt-0.5">
          {position.outcome}
        </div>
      </div>
      <div>
        <div className="font-semibold">
          {formatNumber(avgPrice * 100, 1)}%
        </div>
        <div className="text-xs text-muted-foreground">avg price</div>
      </div>
      <div>
        <div className="font-semibold">
          {formatNumber(position.curPrice * 100, 1)}%
        </div>
        <div className="text-xs text-muted-foreground">final price</div>
      </div>
      <div>
        <div className="font-semibold">
          {formatCompactCurrency(totalBought)}
        </div>
        <div className="text-xs text-muted-foreground">total bought</div>
      </div>
      <div className={cn("flex flex-col", pnlColor)}>
        <div className="font-semibold">{formatCompactCurrency(realizedPnl)}</div>
        <div className="text-xs">
          {pnlPercent > 0 ? "+" : ""}
          {formatNumber(pnlPercent, 1)}%
        </div>
      </div>
    </div>
  );
}

export function UserClosedPositions({ userId }: { userId: string }) {
  const [limit, setLimit] = useState(50);
  const {
    data: positions,
    isLoading,
    error,
  } = useClosedPositionsQuery(userId, limit);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner message="Loading closed positions..." size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive text-sm">
        Error loading closed positions
      </div>
    );
  }

  if (!positions || positions.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No closed positions found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-4 py-3 bg-muted/20 sticky top-0 z-10">
        <div className={cn(POSITION_ROW_GRID_CLASSES, "text-xs font-bold")}>
          <div>Market</div>
          <div>Avg Price</div>
          <div>Final Price</div>
          <div>Total Bought</div>
          <div>Realized PnL</div>
        </div>
      </div>
      <div className="px-4">
        {positions.map((position, index) => (
          <ClosedPositionRow
            key={`${position.conditionId}-${position.outcomeIndex}-${index}`}
            position={position}
          />
        ))}
      </div>
      {positions.length === limit && (
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
      {positions.length < limit && positions.length > 0 && (
        <div className="text-center py-4 text-xs text-muted-foreground">
          All {positions.length} closed positions loaded
        </div>
      )}
    </div>
  );
}

