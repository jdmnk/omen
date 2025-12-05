"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SharedMarketSnapshot } from "./share.store";
import { getOutcomeColorClass } from "@/lib/ui/color.utils";
import {
  getAbsolutePnl,
  getPercentPnl,
} from "../../lib/share/share-metrics.utils";
import { MarketShareChart } from "./MarketShareChart";
import Image from "next/image";
import { formatCompactCurrency, formatNumber } from "@/lib/ui/format.utils";

export function MarketShareCard({
  snapshot,
}: {
  snapshot: SharedMarketSnapshot;
}) {
  const position = snapshot.position;
  const outcomeColor = getOutcomeColorClass(position.outcomeIndex);
  const absolutePnl = getAbsolutePnl(position);
  const percentPnl = getPercentPnl(position);

  return (
    <Card className="flex w-full flex-col gap-3 border-none bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {position.icon && (
              <Image
                src={position.icon}
                alt={position.title ?? ""}
                width={50}
                height={50}
                className="rounded-md"
              />
            )}
            <div className="flex flex-col gap-1">
              <div className="truncate text-lg font-semibold text-black">
                {position.title}
              </div>
              <div
                className={cn("text-base text-muted-foreground", outcomeColor)}
              >
                {position.outcome}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="h-64 w-full">
        <MarketShareChart
          data={snapshot.chartData}
          markers={snapshot.markers}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="text-sm font-semibold text-black">
            {formatCompactCurrency(absolutePnl)}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatNumber(percentPnl)}
          </div>
        </div>
      </div>
    </Card>
  );
}
