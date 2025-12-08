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
import { formatNumber } from "@/lib/ui/format.utils";

type ChartPoint = { time: number | string; value: number };

type MarketShareChartProps = {
  data: ChartPoint[];
  markers?: SeriesMarker<Time>[];
  volumeBars?: HistogramData<Time>[];
  error?: Error | null;
  isLoading?: boolean;
};

const chartOptions: DeepPartial<ChartOptions> = {
  layout: {
    background: { type: ColorType.Solid, color: "transparent" },
    textColor: "#505D7C",
    attributionLogo: false,
  },
  grid: {
    vertLines: { color: "#27272a", visible: false },
    horzLines: { color: "rgba(195, 191, 191, 0.55)", visible: true, style: 2 },
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
    borderVisible: false,
    ticksVisible: false,
    entireTextOnly: true,

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
  localization: {
    priceFormatter: (price: number) => formatNumber(price, 1) + "%",
  },
  handleScale: true,
  handleScroll: true,
};

export function MarketShareChart({
  data,
  markers = [],
  volumeBars = [],
  error,
  isLoading,
}: MarketShareChartProps) {
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
      lastValueVisible: false,
      priceLineVisible: false,
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
      autoscaleInfoProvider: (original: any) => {
        const ogPriceRange = original().priceRange;
        const ogMinValue = ogPriceRange?.minValue;
        const ogMaxValue = ogPriceRange?.maxValue;
        return {
          priceRange: {
            minValue: ogMinValue < 0 ? 0 : ogMinValue,
            maxValue: ogMaxValue > 100 ? 100 : ogMaxValue,
          },
        };
      },
    });
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#3b82f6",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
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
