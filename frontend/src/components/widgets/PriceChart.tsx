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

type PriceChartProps = {
  data: ChartPoint[];
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
    rightBarStaysOnScroll: false,
    fixLeftEdge: true,
    fixRightEdge: true,
  },
  rightPriceScale: {
    borderColor: "#374151",
    scaleMargins: {
      top: 0.1,
      bottom: 0.1,
    },
  },
  handleScale: false,
  handleScroll: false,
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

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
    });

    chartRef.current = chart;

    // Create line series with precision settings
    const lineSeries = chart.addSeries(LineSeries, {
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });
    seriesRef.current = lineSeries;

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
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (data && data.length > 0 && seriesRef.current && chartRef.current) {
      seriesRef.current.setData(data as any);
      // Fit content to ensure data spans the full width
      chartRef.current.timeScale().fitContent();
    }
  }, [data]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-destructive">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
          <p className="text-sm text-muted-foreground">Loading chart...</p>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}
