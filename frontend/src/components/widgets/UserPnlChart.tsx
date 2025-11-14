"use client";

import { useEffect, useRef, useState } from "react";
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
} from "lightweight-charts";
import { Spinner } from "@/components/ui/spinner";
import { Trade } from "@/lib/models/api.models";
import { formatCompactCurrency, formatNumber } from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";

type UserPnlChartProps = {
  data: ChartPoint[];
  trades?: Trade[];
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

export function UserPnlChart({
  data,
  trades = [],
  error,
  isLoading,
}: UserPnlChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const [hoveredTrade, setHoveredTrade] = useState<Trade | null>(null);
  const [hoveredMarkerPosition, setHoveredMarkerPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

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
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
      lineColor: "#22c55e", // green by default
      topColor: "#166534",
      bottomColor: "rgba(34, 197, 94, 0)",
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      lastValueVisible: true,
      priceLineVisible: true,
      priceLineColor: "#22c55e",
      priceLineWidth: 1,
      priceLineStyle: 2,
    });
    seriesRef.current = lineSeries;

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
      chart.remove();
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (data && data.length > 0 && seriesRef.current && chartRef.current) {
      seriesRef.current.setData(data as LineData<Time>[]);

      // Determine if overall PnL is positive or negative and update colors
      const lastValue = data[data.length - 1]?.value || 0;
      const isPositive = lastValue >= 0;

      seriesRef.current.applyOptions({
        lineColor: isPositive ? "#22c55e" : "#ef4444",
        topColor: isPositive ? "#166534" : "#7f1d1d",
        bottomColor: isPositive
          ? "rgba(34, 197, 94, 0)"
          : "rgba(239, 68, 68, 0)",
        priceLineColor: isPositive ? "#22c55e" : "#ef4444",
      });

      // Add trade markers using createSeriesMarkers
      if (trades && trades.length > 0) {
        const markers: SeriesMarker<Time>[] = trades.map((trade) => ({
          time: trade.timestamp as Time,
          position: trade.side === "BUY" ? "belowBar" : "aboveBar",
          color: trade.side === "BUY" ? "#22c55e" : "#ef4444",
          shape: trade.side === "BUY" ? "arrowUp" : "arrowDown",
          text: "",
        }));

        createSeriesMarkers(seriesRef.current, markers);
      } else {
        createSeriesMarkers(seriesRef.current, []);
      }

      chartRef.current.timeScale().fitContent();
    }
  }, [data, trades]);

  // Handle crosshair move to show trade tooltips
  useEffect(() => {
    if (!chartRef.current || !chartContainerRef.current) return;

    const handleCrosshairMove = (param: any) => {
      if (!param.point || !param.time || !trades || trades.length === 0) {
        setHoveredTrade(null);
        setHoveredMarkerPosition(null);
        return;
      }

      // Find if there's a trade at the current time (within 5 minutes tolerance)
      const time = param.time as number;
      const trade = trades.find((t) => Math.abs(t.timestamp - time) < 300);

      if (trade && chartContainerRef.current) {
        setHoveredTrade(trade);
        setHoveredMarkerPosition({
          x: param.point.x,
          y: param.point.y,
        });
      } else {
        setHoveredTrade(null);
        setHoveredMarkerPosition(null);
      }
    };

    chartRef.current.subscribeCrosshairMove(handleCrosshairMove);

    return () => {
      if (chartRef.current) {
        chartRef.current.unsubscribeCrosshairMove(handleCrosshairMove);
      }
    };
  }, [trades]);

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
      <div ref={chartContainerRef} className="w-full h-full" />

      {/* Trade Tooltip */}
      {hoveredTrade && hoveredMarkerPosition && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: hoveredMarkerPosition.x + 15,
            top: hoveredMarkerPosition.y - 10,
          }}
        >
          <div className="bg-background border border-brand-stroke rounded-md shadow-lg p-3 text-xs max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  "font-bold px-1.5 py-0.5 rounded text-xs",
                  hoveredTrade.side === "BUY"
                    ? "bg-outcome-yes/20 text-outcome-yes"
                    : "bg-outcome-no/20 text-outcome-no"
                )}
              >
                {hoveredTrade.side}
              </span>
              <span className="font-semibold truncate max-w-[200px]">
                {hoveredTrade.outcome}
              </span>
            </div>
            <div className="space-y-1 text-muted-foreground">
              <div className="truncate max-w-[250px]">
                <span className="font-medium">{hoveredTrade.title}</span>
              </div>
              <div>
                <span>Size: </span>
                <span className="text-foreground font-medium">
                  {formatNumber(hoveredTrade.size, 0)} shares
                </span>
              </div>
              <div>
                <span>Price: </span>
                <span className="text-foreground font-medium">
                  {formatNumber(hoveredTrade.price * 100, 1)}%
                </span>
              </div>
              <div>
                <span>Value: </span>
                <span className="text-foreground font-medium">
                  {formatCompactCurrency(
                    hoveredTrade.size * hoveredTrade.price
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
