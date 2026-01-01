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

type ChartTheme = {
  textColor: string;
  gridColor: string;
  crosshairColor: string;
  crosshairLabelBg: string;
  lineColor: string;
  topColor: string;
  bottomColor: string;
};

function getThemeColors(): ChartTheme {
  const styles = getComputedStyle(document.documentElement);
  return {
    textColor:
      styles.getPropertyValue("--market-chart-text").trim() || "#8778ae",
    gridColor:
      styles.getPropertyValue("--market-chart-grid").trim() || "#c5c5c5",
    crosshairColor:
      styles.getPropertyValue("--market-chart-crosshair").trim() || "#c5c5c5",
    crosshairLabelBg:
      styles.getPropertyValue("--market-chart-crosshair-label").trim() ||
      "rgba(99, 34, 254, 0.35)",
    lineColor:
      styles.getPropertyValue("--market-chart-line").trim() || "#6322fe",
    topColor:
      styles.getPropertyValue("--market-chart-top").trim() ||
      "rgba(99, 34, 254, 0.25)",
    bottomColor:
      styles.getPropertyValue("--market-chart-bottom").trim() ||
      "rgba(99, 34, 254, 0)",
  };
}

function getChartOptions(theme: ChartTheme): DeepPartial<ChartOptions> {
  return {
    layout: {
      background: { type: ColorType.Solid, color: "transparent" },
      textColor: theme.textColor,
      attributionLogo: false,
    },
    grid: {
      vertLines: { color: theme.gridColor, visible: false },
      horzLines: { color: theme.gridColor, visible: false },
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
        color: theme.crosshairColor,
        width: 1,
        style: 3,
        labelBackgroundColor: theme.crosshairLabelBg,
      },
      horzLine: {
        color: theme.crosshairColor,
        width: 1,
        style: 3,
        labelBackgroundColor: theme.crosshairLabelBg,
      },
    },
  };
}

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

    const theme = getThemeColors();

    const chart = createChart(chartContainerRef.current, {
      ...getChartOptions(theme),
      width: initialWidth,
      height: initialHeight,
    });

    chartRef.current = chart;

    // Create area series with gradient fill
    const lineSeries = chart.addSeries(AreaSeries, {
      lineColor: theme.lineColor,
      topColor: theme.topColor,
      bottomColor: theme.bottomColor,
      priceLineColor: theme.lineColor,
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
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

    const observer = new MutationObserver(() => {
      if (!chartRef.current || !seriesRef.current) return;
      const nextTheme = getThemeColors();
      chartRef.current.applyOptions(getChartOptions(nextTheme));
      seriesRef.current.applyOptions({
        lineColor: nextTheme.lineColor,
        topColor: nextTheme.topColor,
        bottomColor: nextTheme.bottomColor,
        priceLineColor: nextTheme.lineColor,
      });
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
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
