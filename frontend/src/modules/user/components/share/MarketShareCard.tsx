"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SharedMarketSnapshot } from "./share.store";
import { getPnlColorClass } from "@/lib/ui/color.utils";
import {
  getAbsolutePnl,
  getPercentPnl,
  getPositionApr,
  getPositionAvgBuyPrice,
  getPositionAvgSellPrice,
  getPositionVolume,
} from "../../lib/share/share-metrics.utils";
import { MarketShareChart } from "./MarketShareChart";
import Image from "next/image";
import {
  formatAddress,
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPrice,
} from "@/lib/ui/format.utils";
import { useUserDataQuery } from "../../lib/queries/user-data.query";
import { LogoIcon } from "@/components/LogoIcon";
import { useChartData } from "../../lib/chart/useChartData";
import { getMarkersForShareChart } from "../../lib/chart/new-marker.utils";
import { getExposureArea } from "../../lib/chart/exposure-area.utils";
import { PositionPriceChartApex } from "../charts/PositionPriceChartApex";

export function MarketShareCard({
  snapshot,
}: {
  snapshot: SharedMarketSnapshot;
}) {
  const { data: userData } = useUserDataQuery(snapshot.position.proxyWallet);
  const position = snapshot.position;
  const absolutePnl = getAbsolutePnl(position);
  const percentPnl = getPercentPnl(position);
  const pnlColor = getPnlColorClass(percentPnl);
  const addSign = (value: number, formatted: string) => {
    if (value === 0) return formatted;
    return `${value > 0 ? "+" : "-"} ${formatted}`;
  };
  const avgBuyPrice = getPositionAvgBuyPrice(position, snapshot.entries);
  const avgSellPrice = getPositionAvgSellPrice(snapshot.entries);
  const tradesCount = snapshot.entries.length;
  const apr = getPositionApr(position, snapshot.entries);
  const volume = getPositionVolume(position, snapshot.entries);

  const { chartData, fidelitySeconds } = useChartData(
    position.asset,
    snapshot.interval
  );
  const markers = getMarkersForShareChart(snapshot.entries, 5, fidelitySeconds);
  const volumeBars = getExposureArea(
    snapshot.entries,
    position,
    fidelitySeconds
  );

  return (
    <Card className="flex w-full flex-col gap-3 border-none bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-3">
            {position.icon && (
              <div className="relative h-[48px] w-[48px] shrink-0 overflow-hidden rounded-md">
                <Image
                  src={position.icon}
                  alt={position.title ?? ""}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="text-lg font-bold text-black wrap-break-word leading-tight">
                {position.title}
              </div>
              <div className="text-lg font-bold text-[#240F5A]">
                <span className="bg-[#240F5A]/10 px-2 py-0.5 rounded-sm">
                  {position.outcome}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative h-64 w-full">
        <div className="absolute z-10 flex flex-col gap-1 px-1 py-1.5 opacity-60">
          <div className="flex items-center gap-1.5">
            <div className="relative h-3 w-3 shrink-0">
              <div className="absolute inset-0 rounded-full overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1/2 bg-[#35CE8D]" />
                <div className="absolute right-0 top-0 h-full w-1/2 bg-[#F2545B]" />
              </div>
            </div>
            <span className="text-xs text-black font-bold">Trade</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 shrink-0 bg-[#240F5A]/30 border border-[#240F5A]/60" />
            <span className="text-xs text-black font-bold">Position</span>
          </div>
        </div>
        <PositionPriceChartApex
          data={chartData}
          markers={markers}
          volumeBars={volumeBars}
          chartOptions={{
            chartHeight: 260,
            labelColor: "#505d7c",
            colors: {
              lineColor: "#240F5A",
              gradientColors: ["#240F5A99", "#240F5A00"],
              exposureLineColor: "#240F5A",
              exposureFillColor: "#240F5A4D",
              markerBorderColor: "#240F5A",
            },
          }}
        />
      </div>
      <div className="mt-4 flex items-stretch justify-between gap-4 text-black font-bold px-3">
        <div className="flex flex-col gap-1 self-center py-3">
          <div className="text-xl font-bold">
            {addSign(absolutePnl, formatCompactCurrency(Math.abs(absolutePnl)))}
          </div>
          <div className={cn("text-xl", pnlColor)}>
            {addSign(percentPnl, `${formatNumber(Math.abs(percentPnl))}%`)}
          </div>
        </div>

        <div className="self-stretch w-px bg-black/50" />

        <div className="flex gap-4 self-center py-3">
          <div className="flex flex-col gap-1 text-sm">
            <div className="font-bold text-share-gray">APR:</div>
            <div className="text-share-gray">Volume:</div>
          </div>
          <div className="flex flex-col gap-1 text-sm text-left">
            <div className="font-bold">
              {apr ? formatNumber(apr * 100, 1) + "%" : "N/A"}
            </div>
            <div>{formatCompactCurrency(volume, 1)}</div>
          </div>
        </div>

        <div className="self-stretch w-px bg-black/50" />

        <div className="flex gap-4 self-center py-3">
          <div className="flex flex-col gap-1 text-sm">
            <div className="text-share-gray">Avg. Entry:</div>
            <div className="text-share-gray">Avg. Exit:</div>
            <div className="text-share-gray">Trades:</div>
          </div>
          <div className="flex flex-col gap-1 text-sm text-left">
            <div>{formatPrice(avgBuyPrice)}</div>
            <div>{avgSellPrice ? formatPrice(avgSellPrice) : "N/A"}</div>
            <div>{tradesCount}</div>
          </div>
        </div>
      </div>

      {userData && (
        <div className="grid grid-cols-[2fr_1fr] gap-6 mt-2">
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
              <div className="font-bold text-lg break-all">
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
