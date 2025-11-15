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
} from "lightweight-charts";
import { Spinner } from "@/components/ui/spinner";
import { ClosedPosition } from "@/lib/models/frontend.models";
import { formatCompactCurrency } from "@/lib/ui/format.utils";

type UserPnlChartProps = {
  data: ChartPoint[];
  closedPositions?: ClosedPosition[];
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

export function UserPnlChart({
  data,
  closedPositions = [],
  error,
  isLoading,
}: UserPnlChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

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
    if (data && data.length > 0 && chartRef.current) {
      // Remove existing series if it exists to clear old markers
      if (seriesRef.current) {
        chartRef.current.removeSeries(seriesRef.current);
      }

      // Determine if overall PnL is positive or negative
      const lastValue = data[data.length - 1]?.value || 0;
      const isPositive = lastValue >= 0;

      // Create new series with colors based on PnL
      const lineSeries = chartRef.current.addSeries(AreaSeries, {
        priceFormat: {
          type: "price",
          precision: 2,
          minMove: 0.01,
        },
        lineColor: isPositive ? "#22c55e" : "#ef4444",
        topColor: isPositive ? "#166534" : "#7f1d1d",
        bottomColor: isPositive
          ? "rgba(34, 197, 94, 0)"
          : "rgba(239, 68, 68, 0)",
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        lastValueVisible: true,
        priceLineVisible: true,
        priceLineColor: isPositive ? "#22c55e" : "#ef4444",
        priceLineWidth: 1,
        priceLineStyle: 2,
      });

      seriesRef.current = lineSeries;

      // Set the data
      lineSeries.setData(data as LineData<Time>[]);

      // Create markers for closed positions
      if (closedPositions && closedPositions.length > 0) {
        const markers: SeriesMarker<Time>[] = closedPositions.map(
          (position) => {
            const isProfit = position.realizedPnl >= 0;
            const pnlText = formatCompactCurrency(position.realizedPnl);

            // Truncate market title for display (max 20 chars)
            const truncatedTitle =
              position.title.length > 20
                ? position.title.substring(0, 20) + "..."
                : position.title;

            // Combine market name and PnL
            const markerText = `${truncatedTitle}\n${pnlText}`;

            return {
              time: position.timestamp as Time,
              position: isProfit ? "belowBar" : "aboveBar",
              color: isProfit ? "#22c55e" : "#ef4444",
              shape: "circle",
              text: markerText,
            };
          }
        );

        // Use createSeriesMarkers to add markers to the series
        createSeriesMarkers(lineSeries, markers);
      }

      chartRef.current.timeScale().fitContent();
    }
  }, [data, closedPositions]);

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
    </div>
  );
}
