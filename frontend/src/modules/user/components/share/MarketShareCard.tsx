"use client";

import { Card } from "@/components/ui/card";
import { formatCompactCurrency } from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import { PositionPriceChart } from "../charts/PositionPriceChart";
import type { SharedMarketSnapshot } from "./share.store";
import { getOutcomeColorClass } from "@/lib/ui/color.utils";

export function MarketShareCard({
  snapshot,
}: {
  snapshot: SharedMarketSnapshot;
}) {
  const marketLabel =
    snapshot.positionTitle || snapshot.positionOutcome || "Market";
  const outcomeColor = getOutcomeColorClass(snapshot.positionOutcomeIndex);

  return (
    <Card className="flex min-h-[360px] w-full flex-col gap-3 border border-brand-stroke/80 bg-brand-background/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-foreground">
            {marketLabel}
          </p>
          <p className={cn("text-base text-muted-foreground", outcomeColor)}>
            {snapshot.positionOutcome}
          </p>
        </div>
      </div>
      <div className="h-64 w-full">
        <PositionPriceChart
          data={snapshot.chartData}
          markers={snapshot.markers}
        />
      </div>
    </Card>
  );
}
