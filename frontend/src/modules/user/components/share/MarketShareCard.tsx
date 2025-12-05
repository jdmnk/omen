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
import {
  formatCompactCurrency,
  formatNumber,
  getNumberSign,
} from "@/lib/ui/format.utils";

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
              <div className="relative h-[50px] w-[50px] shrink-0 overflow-hidden rounded-md">
                <Image
                  src={position.icon}
                  alt={position.title ?? ""}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex flex-col">
              <div className="truncate text-lg font-bold text-black">
                {position.title}
              </div>
              <div className={cn("text-lg font-bold", outcomeColor)}>
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
      <div className="flex items-stretch justify-between gap-4 text-black px-12 font-bold mt-4">
        <div className="flex flex-col gap-1 self-center">
          <div className="text-xl font-bold">
            {getNumberSign(absolutePnl)} {formatCompactCurrency(absolutePnl)}
          </div>
          <div className={cn("text-xl", outcomeColor)}>
            {getNumberSign(percentPnl)} {formatNumber(percentPnl)}%
          </div>
        </div>

        <div className="self-stretch w-px bg-black/50" />

        <div className="flex gap-4 self-center">
          <div className="flex flex-col gap-1 text-sm">
            <div className="font-bold text-share-gray">APR:</div>
            <div className="text-share-gray">Volume:</div>
          </div>
          <div className="flex flex-col gap-1 text-sm text-left">
            <div className="font-bold">
              {formatCompactCurrency(absolutePnl)}
            </div>
            <div>{formatNumber(percentPnl)}</div>
          </div>
        </div>

        <div className="self-stretch w-px bg-black/50" />

        <div className="flex gap-4 self-center">
          <div className="flex flex-col gap-1 text-sm">
            <div className="text-share-gray">Entry:</div>
            <div className="text-share-gray">Exit:</div>
            <div className="text-share-gray">Trades:</div>
          </div>
          <div className="flex flex-col gap-1 text-sm text-left">
            <div>{formatCompactCurrency(absolutePnl)}</div>
            <div>{formatNumber(percentPnl)}</div>
            <div>12</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
