"use client";

import { useEffect, useRef } from "react";
import {
  AreaSeries,
  ChartOptions,
  ColorType,
  DeepPartial,
  HistogramSeries,
  HistogramData,
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

type ChartPoint = { time: number | string; value: number };

type PositionPriceChartProps = {
  data: ChartPoint[];
  markers?: SeriesMarker<Time>[];
  volumeBars?: HistogramData<Time>[];
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
      top: 0.12,
      bottom: 0.05,
    },
  },
  leftPriceScale: {
    borderColor: "transparent",
    scaleMargins: {
      top: 0.8,
      bottom: 0,
    },
  },
  handleScale: true,
  handleScroll: true,
};

export function PositionPriceChart({
  data,
  markers = [],
  volumeBars = [],
  error,
  isLoading,
}: PositionPriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth || 760;
    const height = containerRef.current.clientHeight || 260;
    const chart = createChart(containerRef.current, {
      ...chartOptions,
      width,
      height,
    });
    const series = chart.addSeries(AreaSeries, {
      ...areaSeriesBaseOptions,
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#3b82f6",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
      borderColor: "transparent",
      borderVisible: false,
      ticksVisible: false,
      entireTextOnly: true,
    });
    chartRef.current = chart;
    seriesRef.current = series;
    volumeSeriesRef.current = volumeSeries;

    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !chartRef.current) return;
      const nextWidth = containerRef.current.clientWidth;
      const nextHeight = containerRef.current.clientHeight;
      if (nextWidth > 0 && nextHeight > 0) {
        chartRef.current.applyOptions({
          width: nextWidth,
          height: nextHeight,
        });
        chartRef.current.timeScale().fitContent();
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (markersPluginRef.current) {
        markersPluginRef.current.detach();
        markersPluginRef.current = null;
      }
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.setData((data as LineData<Time>[]) ?? []);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  useEffect(() => {
    if (!volumeSeriesRef.current) return;
    volumeSeriesRef.current.setData(volumeBars ?? []);
  }, [volumeBars]);

  useEffect(() => {
    if (!seriesRef.current) return;
    if (!markersPluginRef.current) {
      markersPluginRef.current = createSeriesMarkers(
        seriesRef.current,
        markers ?? [],
        {
          zOrder: "top",
        }
      );
      return;
    }
    markersPluginRef.current.setMarkers(markers ?? []);
  }, [markers]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Unable to load chart
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40">
          <Spinner size="sm" />
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
