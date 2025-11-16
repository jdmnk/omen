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
import { ClosedPosition } from "@/lib/models/frontend.models";
import { formatCompactCurrency, formatCurrency } from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import { areaSeriesBaseOptions } from "@/lib/ui/chart.config";

type UserPnlChartProps = {
  data: ChartPoint[];
  closedPositions?: ClosedPosition[];
  analyticsMarkers?: AnalyticsMarker[];
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

type AnalyticsMarker = {
  t: number;
  kind: "swing" | "trade_cluster";
  delta?: number;
  direction?: "up" | "down";
  severity?: "large" | "extreme";
  tradesCount?: number;
  notional?: number;
};

export function UserPnlChart({
  data,
  closedPositions = [],
  analyticsMarkers = [],
  error,
  isLoading,
}: UserPnlChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const closedMarkersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(
    null
  );
  const analyticsMarkersPluginRef =
    useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const markerIdToPositionRef = useRef<Record<string, ClosedPosition>>({});
  const markerIdToAnalyticsRef = useRef<Record<string, AnalyticsMarker>>({});
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
        if (closedMarkersPluginRef.current) {
          try {
            closedMarkersPluginRef.current.detach();
          } catch {
            // ignore
          }
          closedMarkersPluginRef.current = null;
        }
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

      // Create markers for closed positions (no in-chart text; tooltip on hover)
      if (closedPositions && closedPositions.length > 0) {
        const idToPosition: Record<string, ClosedPosition> = {};
        const markers: SeriesMarker<Time>[] = closedPositions.map(
          (position, idx) => {
            const isProfit = position.realizedPnl >= 0;
            const id = `cp-${position.timestamp}-${idx}`;
            idToPosition[id] = position;
            const pnlText = `${isProfit ? "+" : ""}${formatCompactCurrency(
              position.realizedPnl
            )}`;
            return {
              id,
              time: position.timestamp as Time,
              position: isProfit ? "belowBar" : "aboveBar",
              color: isProfit ? "#22c55e" : "#ef4444",
              shape: isProfit ? "arrowUp" : "arrowDown",
              text: pnlText,
            };
          }
        );
        markerIdToPositionRef.current = idToPosition;
        closedMarkersPluginRef.current = createSeriesMarkers(
          lineSeries,
          markers,
          {
            zOrder: "top",
          }
        );
      }

      // Create markers for analytics (swing/trade clusters)
      if (analyticsMarkers && analyticsMarkers.length > 0) {
        const idToAnalytics: Record<string, AnalyticsMarker> = {};
        const markers: SeriesMarker<Time>[] = analyticsMarkers.map(
          (mk, idx) => {
            const id = `am-${mk.t}-${idx}`;
            idToAnalytics[id] = mk;
            if (mk.kind === "swing") {
              const isUp = mk.direction === "up";
              const color = isUp ? "#22c55e" : "#ef4444";
              const text =
                (mk.delta !== undefined
                  ? `${isUp ? "+" : ""}${formatCompactCurrency(mk.delta)}`
                  : "") +
                (mk.severity ? ` ${mk.severity === "extreme" ? "!" : ""}` : "");
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

        // Closed position tooltip
        const pos = markerIdToPositionRef.current[hoveredId];
        if (pos) {
          // Build tooltip content
          const isProfit = pos.realizedPnl >= 0;
          const dateStr = new Date(pos.timestamp * 1000).toLocaleString();
          const pnlStr = formatCurrency(pos.realizedPnl, 2);
          const avgStr = formatCurrency(pos.avgPrice, 2);
          const curStr = formatCurrency(pos.curPrice, 2);
          const title = pos.title;
          const outcome = pos.outcome;

          tooltipEl.innerHTML = `
            <div class="flex flex-col gap-1">
              <div class="font-medium">${title}</div>
              <div class="text-[11px] text-zinc-300">${dateStr}</div>
              <div class="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
                <div class="text-zinc-400">Outcome</div>
                <div class="text-zinc-100 text-right">${outcome}</div>
                <div class="text-zinc-400">Avg Price</div>
                <div class="text-zinc-100 text-right">${avgStr}</div>
                <div class="text-zinc-400">Close Price</div>
                <div class="text-zinc-100 text-right">${curStr}</div>
                <div class="text-zinc-400">Realized PnL</div>
                <div class="${
                  isProfit ? "text-emerald-400" : "text-red-400"
                } text-right font-medium">${pnlStr}</div>
              </div>
            </div>
          `;
        } else {
          // Analytics tooltip
          const am = markerIdToAnalyticsRef.current[hoveredId];
          if (!am) {
            tooltipEl.classList.add("hidden");
            return;
          }
          const dateStr = new Date(am.t * 1000).toLocaleString();
          if (am.kind === "swing") {
            const isUp = am.direction === "up";
            const deltaStr =
              am.delta !== undefined
                ? `${isUp ? "+" : ""}${formatCurrency(am.delta, 2)}`
                : "";
            tooltipEl.innerHTML = `
              <div class="flex flex-col gap-1">
                <div class="font-medium">PnL Swing ${
                  am.severity === "extreme" ? "(extreme)" : ""
                }</div>
                <div class="text-[11px] text-zinc-300">${dateStr}</div>
                <div class="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
                  <div class="text-zinc-400">Direction</div>
                  <div class="text-zinc-100 text-right">${
                    isUp ? "Up" : "Down"
                  }</div>
                  <div class="text-zinc-400">Change</div>
                  <div class="text-zinc-100 text-right">${deltaStr}</div>
                </div>
              </div>
            `;
          } else {
            const cnt = am.tradesCount ?? 0;
            const ntoStr =
              am.notional !== undefined ? formatCurrency(am.notional, 2) : "-";
            tooltipEl.innerHTML = `
              <div class="flex flex-col gap-1">
                <div class="font-medium">Trade Activity</div>
                <div class="text-[11px] text-zinc-300">${dateStr}</div>
                <div class="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
                  <div class="text-zinc-400">Trades</div>
                  <div class="text-zinc-100 text-right">${cnt}</div>
                  <div class="text-zinc-400">Notional</div>
                  <div class="text-zinc-100 text-right">${ntoStr}</div>
                </div>
              </div>
            `;
          }
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
  }, [data, closedPositions, analyticsMarkers]);

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
