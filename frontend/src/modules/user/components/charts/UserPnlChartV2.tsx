"use client";

import { useEffect, useRef } from "react";
import {
  AreaSeries,
  ChartOptions,
  ColorType,
  DeepPartial,
  IChartApi,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  LineData,
  SeriesMarker,
  Time,
  createChart,
  createSeriesMarkers,
} from "lightweight-charts";
import { Spinner } from "@/components/ui/spinner";
import { areaSeriesBaseOptions } from "@/lib/ui/chart.config";
import { formatCompactCurrency } from "@/lib/ui/format.utils";

type ChartPoint = {
  time: string | number;
  value: number;
};

export type PositionMarker = SeriesMarker<Time>;

type UserPnlChartV2Props = {
  data: ChartPoint[];
  markers?: PositionMarker[];
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

export function UserPnlChartV2({
  data,
  markers = [],
  error,
  isLoading,
}: UserPnlChartV2Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

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
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      if (markersPluginRef.current) {
        try {
          markersPluginRef.current.detach();
        } catch {
          // ignore plugin detach errors
        }
        markersPluginRef.current = null;
      }
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    const formattedData = Array.isArray(data)
      ? (data as LineData<Time>[])
      : [];
    seriesRef.current.setData(formattedData);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  useEffect(() => {
    if (!seriesRef.current) return;
    if (!markersPluginRef.current) {
      markersPluginRef.current = createSeriesMarkers(
        seriesRef.current,
        markers ?? [],
        { zOrder: "top" }
      );
      return;
    }
    markersPluginRef.current.setMarkers(markers ?? []);
  }, [markers]);

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
