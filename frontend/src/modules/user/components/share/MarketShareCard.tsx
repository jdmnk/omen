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
  formatAddress,
  formatCompactCurrency,
  formatNumber,
} from "@/lib/ui/format.utils";
import { useUserDataQuery } from "../../lib/queries/user-data.query";
import { Logo } from "@/components/Logo";
import { LogoIcon } from "@/components/LogoIcon";

export function MarketShareCard({
  snapshot,
}: {
  snapshot: SharedMarketSnapshot;
}) {
  const { data: userData } = useUserDataQuery(snapshot.position.proxyWallet);
  const position = snapshot.position;
  const outcomeColor = getOutcomeColorClass(position.outcomeIndex);
  const absolutePnl = getAbsolutePnl(position);
  const percentPnl = getPercentPnl(position);
  const addSign = (value: number, formatted: string) => {
    if (value === 0) return formatted;
    return `${value > 0 ? "+" : "-"} ${formatted}`;
  };

  return (
    <Card className="flex w-full flex-col gap-3 border-none bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-4">
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
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="truncate text-lg font-bold text-black">
                {position.title}
              </div>
              <div className={"text-lg font-bold text-brand-highlight"}>
                <span className="bg-brand-highlight/10 px-2 py-0.5 rounded-md">
                  {position.outcome}
                </span>
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
      <div className="mt-4 flex items-stretch justify-between gap-4 text-black font-bold">
        <div className="flex flex-col gap-1 self-center">
          <div className="text-xl font-bold">
            {addSign(absolutePnl, formatCompactCurrency(Math.abs(absolutePnl)))}
          </div>
          <div className={cn("text-xl", outcomeColor)}>
            {addSign(percentPnl, `${formatNumber(Math.abs(percentPnl))}%`)}
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

      {userData && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-5 relative">
            <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-full">
              <Image
                src={userData.profileImage ?? ""}
                alt={userData.name ?? ""}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col text-black">
              <div className="font-bold text-lg">
                {userData.name || formatAddress(userData.proxyWallet ?? "")}
              </div>
              {userData.xUsername && (
                <div className="text-xs">@{userData.xUsername}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <LogoIcon className="h-6 w-6 text-share-gray" />
            <div className="text-base font-bold text-share-gray">
              omeninsight.com
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
