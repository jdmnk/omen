"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  DeepPartial,
  ChartOptions,
  AreaSeries,
  LineData,
  Time,
} from "lightweight-charts";
import { Spinner } from "@/components/ui/spinner";

type PriceChartProps = {
  data: ChartPoint[];
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
      bottom: 0,
    },
  },
  handleScale: false,
  handleScroll: false,
  crosshair: {
    mode: 1, // Normal crosshair
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
  time: string | number; // utc data or timestamp in seconds
  value: number;
};

export function PriceChart({ data, error, isLoading }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ReturnType<IChartApi["addSeries"]> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Get initial dimensions, fallback to reasonable defaults if 0
    const initialWidth = chartContainerRef.current.clientWidth || 800;
    const initialHeight = chartContainerRef.current.clientHeight || 400;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: initialWidth,
      height: initialHeight,
    });

    chartRef.current = chart;

    // Create area series with gradient fill
    const lineSeries = chart.addSeries(AreaSeries, {
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
      lineColor: "#651fff", // cyan-400 - vibrant but professional
      topColor: "#341084", // Start color at the line
      bottomColor: "rgba(101, 15, 255, 0)", // Fade to transparent at bottom
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      lastValueVisible: true,
      priceLineVisible: true,
      priceLineColor: "#651fff",
      priceLineWidth: 1,
      priceLineStyle: 2, // dashed
    });
    seriesRef.current = lineSeries;

    // Handle resize using ResizeObserver to detect container size changes
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const width = chartContainerRef.current.clientWidth;
        const height = chartContainerRef.current.clientHeight;
        // Only update if we have valid dimensions
        if (width > 0 && height > 0) {
          chartRef.current.applyOptions({
            width,
            height,
          });
        }
      }
    };

    // Use ResizeObserver to watch for container size changes
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    // Also listen to window resize as fallback
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
      // Fit content to ensure data spans the full width
      chartRef.current.timeScale().fitContent();
    }
  }, [data]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">
            Unable to load price history
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
            Loading chart...
          </p>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}
