"use client";

import { Card } from "@/components/ui/card";
import { formatCompactCurrency } from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import { PositionPriceChart } from "../charts/PositionPriceChart";
import type { SharedMarketSnapshot } from "./share.store";

const INTERVAL_LABELS: Record<string, string> = {
  "1h": "1H",
  "6h": "6H",
  "1d": "1D",
  "1w": "1W",
  "1m": "1M",
  max: "MAX",
};

export function MarketShareCard({
  snapshot,
}: {
  snapshot: SharedMarketSnapshot;
}) {
  const marketLabel =
    snapshot.positionTitle || snapshot.positionOutcome || "Market";
  const intervalLabel =
    INTERVAL_LABELS[snapshot.interval] ?? snapshot.interval.toUpperCase();

  return (
    <Card className="flex min-h-[360px] w-full flex-col gap-3 border border-brand-stroke/80 bg-brand-background/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {marketLabel}
          </p>
          <p
            className={cn(
              "text-xs text-muted-foreground",
              snapshot.outcomeClassName
            )}
          >
            {snapshot.positionOutcome ?? "Outcome"} ·{" "}
            {formatCompactCurrency(snapshot.positionValue)}
          </p>
        </div>
        <span className="rounded border border-brand-stroke px-2 py-1 text-[11px] font-semibold uppercase text-brand-foreground">
          {intervalLabel}
        </span>
      </div>
      <div className="h-64 w-full">
        <PositionPriceChart
          data={snapshot.chartData}
          markers={snapshot.markers}
        />
      </div>
      {snapshot.marketUrl ? (
        <a
          href={snapshot.marketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-foreground underline underline-offset-2 hover:text-brand-foreground/80"
        >
          View market on Polymarket
        </a>
      ) : null}
    </Card>
  );
}
