"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  DeepPartial,
  ChartOptions,
  LineSeries,
} from "lightweight-charts";
import { Interval } from "@/lib/models/api.models";

type PriceChartProps = {
  data: ChartPoint[];
  interval?: Interval;
  onIntervalChange?: (interval: Interval) => void;
  error?: Error | null;
  isLoading?: boolean;
};

const chartOptions: DeepPartial<ChartOptions> = {
  layout: {
    background: { type: ColorType.Solid, color: "transparent" },
    textColor: "#9ca3af",
  },
  height: 350,
  grid: {
    vertLines: { color: "#1f2937" },
    horzLines: { color: "#1f2937" },
  },
  timeScale: {
    borderColor: "#374151",
    timeVisible: true,
  },
  rightPriceScale: {
    borderColor: "#374151",
  },
  handleScale: false,
  handleScroll: false,
};

type ChartPoint = {
  time: string | number; // utc data or timestamp in seconds
  value: number;
};

const INTERVALS: Interval[] = ["1h", "6h", "1d", "1w", "1m", "max"];

const INTERVAL_LABELS: Record<Interval, string> = {
  "1h": "1H",
  "6h": "6H",
  "1d": "1D",
  "1w": "1W",
  "1m": "1M",
  max: "MAX",
};

export function PriceChart({
  data,
  interval = "1w",
  onIntervalChange,
  error,
  isLoading,
}: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ReturnType<IChartApi["addSeries"]> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
    });

    chartRef.current = chart;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (data && data.length > 0 && chartRef.current) {
      const lineSeries = chartRef.current.addSeries(LineSeries);
      if (lineSeries) {
        lineSeries.setData(data as any);
      }
    }
  }, [data, chartRef]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-destructive">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Interval Selector */}
      <div className="flex items-center gap-1 mb-3 px-2">
        {INTERVALS.map((int) => (
          <button
            key={int}
            onClick={() => onIntervalChange?.(int)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              interval === int
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {INTERVAL_LABELS[int]}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="relative flex-1 w-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
            <p className="text-sm text-muted-foreground">Loading chart...</p>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
