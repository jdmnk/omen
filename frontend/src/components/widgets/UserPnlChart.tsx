"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  createSeriesMarkers,
  ColorType,
  IChartApi,
  ISeriesApi,
  DeepPartial,
  ChartOptions,
  AreaSeries,
  LineData,
  Time,
  SeriesMarker,
  ISeriesMarkersPluginApi,
} from "lightweight-charts";
import { Spinner } from "@/components/ui/spinner";
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
} from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import { areaSeriesBaseOptions } from "@/lib/ui/chart.config";
import type {
  MarkerMarketInfo,
  MarkerTradeInfo,
  PnlMarker,
} from "@/lib/models/api.models";

type UserPnlChartProps = {
  data: ChartPoint[];
  analyticsMarkers?: PnlMarker[];
  error?: Error | null;
  isLoading?: boolean;
};

const chartOptions: DeepPartial<ChartOptions> = {
  layout: {
    background: { type: ColorType.Solid, color: "transparent" },
    textColor: "#9ca3af",
    attributionLogo: false,
  },
  grid: {
    vertLines: { color: "#27272a", visible: false },
    horzLines: { color: "#27272a", visible: false },
  },
  timeScale: {
    borderColor: "transparent",
    timeVisible: true,
    rightBarStaysOnScroll: false,
    fixLeftEdge: true,
    fixRightEdge: true,
  },
  rightPriceScale: {
    borderColor: "transparent",
    scaleMargins: {
      top: 0.1,
      bottom: 0.1,
    },
  },
  localization: {
    priceFormatter: (price: number) => formatCompactCurrency(price),
  },
  handleScale: false,
  handleScroll: false,
  crosshair: {
    mode: 1,
    vertLine: {
      color: "#52525b",
      width: 1,
      style: 3,
      labelBackgroundColor: "#3f3f46",
    },
    horzLine: {
      color: "#52525b",
      width: 1,
      style: 3,
      labelBackgroundColor: "#3f3f46",
    },
  },
};

type ChartPoint = {
  time: string | number;
  value: number;
};

const sizeFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function buildMarketDetailsHtml(markets?: MarkerMarketInfo[]): string {
  if (!markets || markets.length === 0) {
    return "";
  }

  const sections = markets
    .map((market) => {
      const title = market.title ?? "Market";
      const outcome = market.outcome ? `∙ ${market.outcome}` : "";
      const tradesCount = market.tradesCount ?? 0;
      let avgPriceStr = "-";
      if (market.avgPrice !== undefined && market.avgPrice !== null) {
        const truncated = Math.trunc(market.avgPrice * 100) / 100;
        avgPriceStr = formatCurrency(truncated, 2);
      }
      const notionalStr =
        market.notional !== undefined && market.notional !== null
          ? formatCompactCurrency(market.notional, 2)
          : "-";
      const sizeStr =
        market.totalSize !== undefined && market.totalSize !== null
          ? sizeFormatter.format(market.totalSize)
          : "";

      return `
        <div class="flex flex-col gap-0.5 border-t border-zinc-800 pt-1 text-[11px]">
          <div class="flex items-center justify-between gap-2">
            <span class="text-zinc-100 font-medium truncate">${title}</span>
            <span class="text-zinc-400">${notionalStr}</span>
          </div>
          <div class="flex items-center justify-between text-zinc-500">
            <span>${tradesCount} trades ${outcome}</span>
          </div>
        </div>
      `;
    })
    .join("");

  const note = `<div class="text-[10px] text-zinc-500 uppercase tracking-wide">
    Top markets in this window
  </div>`;
  return `<div class="mt-2 flex flex-col gap-1">${note}${sections}</div>`;
}

function buildTradeDetailsHtml(trades?: MarkerTradeInfo[]): string {
  if (!trades || trades.length === 0) {
    return "";
  }
  const sections = trades
    .slice(0, 3)
    .map((trade, idx) => {
      const side = (trade.side ?? "").toUpperCase();
      const sideClass = side === "BUY" ? "text-emerald-400" : "text-red-400";
      const outcome = trade.outcome ?? "";
      const sizeValue =
        trade.size !== undefined && trade.size !== null ? trade.size : 0;
      const sizeStr = formatNumber(sizeValue, sizeValue >= 1 ? 0 : 2);
      const priceCents =
        trade.price !== undefined && trade.price !== null
          ? `${(trade.price * 100).toFixed(0)}¢`
          : "-";
      const fallbackNotional = (trade.size ?? 0) * (trade.price ?? 0);
      const notional = trade.notional ?? fallbackNotional;
      const notionalStr = formatCompactCurrency(notional ?? 0, 2);
      const label =
        trade.title ?? (outcome ? `${side} ${outcome}` : `Trade #${idx + 1}`);

      return `
        <div class="border-t border-zinc-800 pt-1 text-[11px] flex flex-col gap-1">
          <div class="flex items-center justify-between gap-2">
            <span>  
              <span class="${sideClass} font-semibold">${side || "TRADE"}</span>
              <span class="text-zinc-100">${sizeStr}${
        outcome ? ` ${outcome}` : ""
      } @ ${priceCents}</span>
            </span>
            <span>${notionalStr}</span>
          </div>
          <div class="flex items-center justify-between text-zinc-400 gap-2">
            <span class="truncate">${label}</span>
          </div>
        </div>
      `;
    })
    .join("");

  const note = `<div class="text-[10px] text-zinc-500 uppercase tracking-wide">
    Highlighted trades in this window
  </div>`;
  return `<div class="mt-2 flex flex-col gap-1">${note}${sections}</div>`;
}

export function UserPnlChart({
  data,
  analyticsMarkers = [],
  error,
  isLoading,
}: UserPnlChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const analyticsMarkersPluginRef =
    useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const markerIdToAnalyticsRef = useRef<Record<string, PnlMarker>>({});
  const crosshairHandlerRef = useRef<((param: any) => void) | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const initialWidth = chartContainerRef.current.clientWidth || 800;
    const initialHeight = chartContainerRef.current.clientHeight || 400;

    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: initialWidth,
      height: initialHeight,
    });

    chartRef.current = chart;

    // Create area series - color will be green for positive PnL, red for negative
    const lineSeries = chart.addSeries(AreaSeries, {
      ...areaSeriesBaseOptions,
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });
    seriesRef.current = lineSeries;

    // Create tooltip container
    const tooltip = document.createElement("div");
    tooltip.className = cn(
      "absolute z-20 pointer-events-none hidden rounded-md border px-3 py-2 text-xs shadow-md",
      "border-zinc-700 bg-zinc-900/90 text-zinc-100 backdrop-blur"
    );
    tooltip.style.left = "0px";
    tooltip.style.top = "0px";
    tooltipRef.current = tooltip;
    chartContainerRef.current.appendChild(tooltip);

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const width = chartContainerRef.current.clientWidth;
        const height = chartContainerRef.current.clientHeight;
        if (width > 0 && height > 0) {
          chartRef.current.applyOptions({
            width,
            height,
          });
        }
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    window.addEventListener("resize", handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      // cleanup tooltip
      if (tooltipRef.current && tooltipRef.current.parentElement) {
        tooltipRef.current.parentElement.removeChild(tooltipRef.current);
      }
      tooltipRef.current = null;
      chart.remove();
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (data && data.length > 0 && chartRef.current) {
      // Remove existing series if it exists to clear old markers
      if (seriesRef.current) {
        // detach markers plugin if any
        if (analyticsMarkersPluginRef.current) {
          try {
            analyticsMarkersPluginRef.current.detach();
          } catch {
            // ignore
          }
          analyticsMarkersPluginRef.current = null;
        }
        // unsubscribe old crosshair handler if any
        if (crosshairHandlerRef.current) {
          chartRef.current?.unsubscribeCrosshairMove(
            crosshairHandlerRef.current
          );
          crosshairHandlerRef.current = null;
        }
        chartRef.current.removeSeries(seriesRef.current);
      }

      // Create new series with shared colors (match PriceChart)
      const lineSeries = chartRef.current.addSeries(AreaSeries, {
        ...areaSeriesBaseOptions,
        priceFormat: {
          type: "price",
          precision: 2,
          minMove: 0.01,
        },
      });

      seriesRef.current = lineSeries;

      // Set the data
      lineSeries.setData(data as LineData<Time>[]);

      // Create markers for analytics (swing/trade clusters)
      if (analyticsMarkers && analyticsMarkers.length > 0) {
        const idToAnalytics: Record<string, PnlMarker> = {};
        const markers: SeriesMarker<Time>[] = analyticsMarkers.map(
          (mk, idx) => {
            const id = `am-${mk.t}-${idx}`;
            idToAnalytics[id] = mk;
            if (mk.kind === "swing") {
              const isUp = mk.direction === "up";
              const color = isUp ? "#22c55e" : "#ef4444";
              const text = mk.delta
                ? `${isUp ? "+" : ""}${formatCompactCurrency(mk.delta)}`
                : "";
              // (mk.severity ? ` ${mk.severity === "extreme" ? "!" : ""}` : "");
              return {
                id,
                time: mk.t as Time,
                position: isUp ? "belowBar" : "aboveBar",
                color,
                shape: isUp ? "circle" : "circle",
                text: text.trim(),
              };
            } else {
              // trade_cluster
              const color = "#60a5fa"; // blue
              const text = mk.tradesCount ? `${mk.tradesCount}T` : "";
              return {
                id,
                time: mk.t as Time,
                position: "aboveBar",
                color,
                shape: "square",
                text,
              };
            }
          }
        );
        markerIdToAnalyticsRef.current = idToAnalytics;
        analyticsMarkersPluginRef.current = createSeriesMarkers(
          lineSeries,
          markers,
          {
            zOrder: "top",
          }
        );
      }

      // Tooltip handling on marker hover
      const handler = (param: any) => {
        const tooltipEl = tooltipRef.current;
        if (!tooltipEl) return;

        // Hide if not on chart
        if (!param?.point) {
          tooltipEl.classList.add("hidden");
          return;
        }

        const hoveredId = param.hoveredObjectId as string | undefined;
        if (!hoveredId) {
          tooltipEl.classList.add("hidden");
          return;
        }

        // Analytics tooltip
        const am = markerIdToAnalyticsRef.current[hoveredId];
        if (!am) {
          tooltipEl.classList.add("hidden");
          return;
        }
        const dateStr = new Date(am.t * 1000).toLocaleString();
        const marketsHtml = buildMarketDetailsHtml(am.markets ?? undefined);
        const tradesHtml = buildTradeDetailsHtml(am.trades ?? undefined);
        if (am.kind === "swing") {
          const isUp = am.direction === "up";
          const directionLabel = isUp ? "UP" : "DOWN";
          const directionClass = isUp ? "text-emerald-400" : "text-red-400";
          const deltaStr = am.delta
            ? `${isUp ? "+" : ""}${formatCompactCurrency(am.delta, 2)}`
            : "";
          tooltipEl.innerHTML = `
            <div class="flex flex-col gap-1 text-[11px]">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-zinc-100">PnL Swing</span>
                <span class="${directionClass} font-semibold">${directionLabel}</span>
              </div>
              <div class="flex items-center justify-between text-zinc-400">
                <span class="text-zinc-100 self-end">${deltaStr}</span>
              </div>
              ${marketsHtml}
              ${tradesHtml}              
            </div>
          `;
        } else {
          const cnt = am.tradesCount ?? 0;
          const ntoStr = am.notional
            ? formatCompactCurrency(am.notional, 2)
            : "-";
          tooltipEl.innerHTML = `
            <div class="flex flex-col gap-1 text-[11px]">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-zinc-100">Trade Cluster</span>
                <span class="text-sky-300 font-semibold">${ntoStr}</span>
              </div>
              <div class="flex items-center justify-between text-zinc-400">
                
                <span class="self-end">${cnt} trades</span>
              </div>
              ${marketsHtml}
              ${tradesHtml}              
            </div>
          `;
        }

        // Position tooltip relative to container
        const container = chartContainerRef.current!;
        const containerRect = container.getBoundingClientRect();
        // param.point is relative to the chart pane
        const margin = 12;
        let left = param.point.x + margin;
        let top = param.point.y + margin;

        // Pre-display to measure
        tooltipEl.style.left = "0px";
        tooltipEl.style.top = "0px";
        tooltipEl.classList.remove("hidden");
        const tooltipRect = tooltipEl.getBoundingClientRect();

        if (left + tooltipRect.width > containerRect.width) {
          left = Math.max(0, param.point.x - tooltipRect.width - margin);
        }
        if (top + tooltipRect.height > containerRect.height) {
          top = Math.max(0, param.point.y - tooltipRect.height - margin);
        }

        tooltipEl.style.left = `${left}px`;
        tooltipEl.style.top = `${top}px`;
      };

      crosshairHandlerRef.current = handler;
      chartRef.current.subscribeCrosshairMove(handler);

      chartRef.current.timeScale().fitContent();
    }
  }, [data, analyticsMarkers]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">
            Unable to load PnL history
          </p>
          <p className="text-xs text-muted-foreground">
            Chart data is temporarily unavailable
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/50 backdrop-blur-sm z-10">
          <Spinner size="md" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading PnL chart...
          </p>
        </div>
      )}
      <div ref={chartContainerRef} className="relative w-full h-full" />
    </div>
  );
}
