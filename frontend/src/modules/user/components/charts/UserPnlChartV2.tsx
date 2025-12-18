"use client";

import { useEffect, useRef } from "react";
import {
  AreaSeries,
  ChartOptions,
  ColorType,
  DeepPartial,
  IChartApi,
  ISeriesApi,
  LineData,
  MouseEventParams,
  Time,
  createChart,
} from "lightweight-charts";
import { Spinner } from "@/components/ui/spinner";
import { areaSeriesBaseOptions } from "@/lib/ui/chart.config";

type ChartPoint = {
  time: string | number;
  value: number;
};

type UserPnlChartV2Props = {
  data: ChartPoint[];
  error?: Error | null;
  isLoading?: boolean;
  onCrosshairMove?: (value: number | null) => void;
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
    visible: false,
  },
  rightPriceScale: {
    borderColor: "transparent",
    scaleMargins: {
      top: 0.1,
      bottom: 0.1,
    },
    visible: false,
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

export function UserPnlChartV2({
  data,
  error,
  isLoading,
  onCrosshairMove,
}: UserPnlChartV2Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const onCrosshairMoveRef = useRef(onCrosshairMove);

  useEffect(() => {
    onCrosshairMoveRef.current = onCrosshairMove;
  }, [onCrosshairMove]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const initialWidth = chartContainerRef.current.clientWidth || 800;
    const initialHeight = chartContainerRef.current.clientHeight || 400;

    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: initialWidth,
      height: initialHeight,
    });

    const lineSeries = chart.addSeries(AreaSeries, {
      ...areaSeriesBaseOptions,
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });

    chartRef.current = chart;
    seriesRef.current = lineSeries;

    const handleCrosshairMove = (param: MouseEventParams<Time>) => {
      if (!onCrosshairMoveRef.current) return;

      if (!param.time || !param.seriesData || param.seriesData.size === 0) {
        onCrosshairMoveRef.current(null);
        return;
      }

      const seriesData = param.seriesData.get(lineSeries);
      if (seriesData && "value" in seriesData) {
        onCrosshairMoveRef.current(seriesData.value);
      }
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);

    const handleResize = () => {
      if (!chartContainerRef.current || !chartRef.current) return;
      const width = chartContainerRef.current.clientWidth;
      const height = chartContainerRef.current.clientHeight;
      if (width > 0 && height > 0) {
        chartRef.current.applyOptions({ width, height });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);
    window.addEventListener("resize", handleResize);

    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    const formattedData = Array.isArray(data) ? (data as LineData<Time>[]) : [];
    seriesRef.current.setData(formattedData);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

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
    <div className="relative w-full h-[80px]">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/50 backdrop-blur-sm">
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
