"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { SeriesMarker, Time } from "lightweight-charts";
import { Spinner } from "@/components/ui/spinner";
import { formatNumber } from "@/lib/ui/format.utils";
import type { ExposureAreaPoint } from "../../lib/chart/exposure-area.utils";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ChartPoint = { time: number | string; value: number };

// Accept lightweight-charts types for compatibility
type PositionPriceChartApexProps = {
  data: ChartPoint[];
  markers?: SeriesMarker<Time>[];
  volumeBars?: ExposureAreaPoint[];
  error?: Error | null;
  isLoading?: boolean;
  /** Chart height - number (pixels) or string (e.g. "100%"). Defaults to 360. */
  height?: number | string;
  labelColor?: string;
};

function convertTimeToTimestamp(time: number | string | Time): number {
  if (typeof time === "number") {
    // If timestamp is in seconds (Unix timestamp), convert to milliseconds
    // Unix timestamps are typically < 1_000_000_000_000 (year 2001 in ms)
    // If it's already in milliseconds (> 1_000_000_000_000), use as-is
    if (time < 1_000_000_000_000) {
      return time * 1000;
    }
    return time;
  }
  if (typeof time === "string") {
    return new Date(time).getTime();
  }
  return Date.now();
}

export function PositionPriceChartApex({
  data,
  markers = [],
  volumeBars = [],
  error,
  isLoading,
  height = 360,
  labelColor = "#949ba6",
}: PositionPriceChartApexProps) {
  const chartData = useMemo(() => {
    const priceData = data.map((point) => [
      convertTimeToTimestamp(point.time),
      point.value,
    ]);

    const exposureData = volumeBars.map((bar) => [
      convertTimeToTimestamp(bar.time),
      bar.value,
    ]);

    return { priceData, exposureData };
  }, [data, volumeBars]);

  const annotations = useMemo(() => {
    if (!markers.length || !data.length) return { points: [] };

    // Create a map for quick lookup of y values by time
    const dataMap = new Map<number, number>();
    data.forEach((point) => {
      const timestamp = convertTimeToTimestamp(point.time);
      dataMap.set(timestamp, point.value);
    });

    const points = markers.map((marker) => {
      const x = convertTimeToTimestamp(marker.time);

      // Find closest data point for y value using the map
      let y = data[0]?.value ?? 0;
      let minDiff = Infinity;

      // First try exact match
      if (dataMap.has(x)) {
        y = dataMap.get(x)!;
      } else {
        // Find closest point
        data.forEach((point) => {
          const pointTime = convertTimeToTimestamp(point.time);
          const diff = Math.abs(pointTime - x);
          if (diff < minDiff) {
            minDiff = diff;
            y = point.value;
          }
        });
      }

      const markerSize = marker.size ? marker.size * 6 : 6;
      const markerColor = marker.color || "#651fff";
      const lineColor = "#651fff"; // Same as the chart line color
      const labelOffset = 1;

      return {
        x,
        y,
        marker: {
          size: markerSize,
          fillColor: markerColor,
          strokeColor: lineColor,
          strokeWidth: 2,
          shape: marker.shape === "square" ? "square" : "circle",
          radius: marker.size ? marker.size * 2 : 3,
        },
        label: marker.text
          ? {
              text: marker.text,
              textAnchor: "middle",
              position: marker.position === "belowBar" ? "bottom" : "top",
              offsetY:
                marker.position === "belowBar" ? -labelOffset : labelOffset,
              borderWidth: 0,
              borderColor: "transparent",
              style: {
                color: markerColor,
                fontSize: "11px",
                fontWeight: 500,
                background: "transparent",
                padding: {
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                },
              },
            }
          : undefined,
      };
    });

    return { points };
  }, [markers, data]);

  const series = useMemo(() => {
    const seriesArray: ApexAxisChartSeries = [
      {
        name: "Price",
        type: "area",
        data: chartData.priceData,
      },
    ];

    if (chartData.exposureData.length > 0) {
      seriesArray.push({
        name: "Exposure",
        type: "area",
        data: chartData.exposureData,
      });
    }

    return seriesArray;
  }, [chartData]);

  const options: ApexCharts.ApexOptions = useMemo(
    () => ({
      chart: {
        type: "line",
        height,
        width: "100%",
        background: "transparent",
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: true,
        },
        animations: {
          enabled: false,
        },
        fontFamily: "inherit",
        offsetX: 0,
        offsetY: 0,
        spacing: [0, 0, 0, 0],
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve:
          chartData.exposureData.length > 0
            ? ["straight", "stepline"]
            : "straight",
        width: 2,
        colors:
          chartData.exposureData.length > 0
            ? ["#651fff", "#3b82f6"]
            : ["#651fff"],
      },
      fill: {
        type: ["gradient", "solid"],
        gradient: {
          type: "vertical",
          shadeIntensity: 1,
          opacityFrom: 0.85,
          opacityTo: 0.05,
          stops: [0, 95],
          colorStops: [
            [
              { offset: 0, color: "#651fff", opacity: 0.6 },
              { offset: 50, color: "#4a1199", opacity: 0.3 },
              { offset: 100, color: "#1a0533", opacity: 0.05 },
            ],
          ],
        },
        colors: ["#651fff", "#3b82f6"],
        opacity: [0.7, 0.5],
      },

      grid: {
        show: false,
        borderColor: "transparent",
        padding: {
          top: 0,
          left: 0,
          right: -10,
          bottom: 0,
        },
      },
      xaxis: {
        type: "datetime",
        labels: {
          style: {
            colors: labelColor,
            fontSize: "11px",
          },
          hideOverlappingLabels: true,
          offsetX: 0,
          offsetY: 0,
          trim: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: [
        {
          labels: {
            style: {
              colors: labelColor,
              fontSize: "11px",
            },
            formatter: (val: number) => `${formatNumber(val, 1)}%`,
            offsetX: -20,
          },
          opposite: true,
        },
        ...(chartData.exposureData.length > 0
          ? [
              {
                show: false,
                opposite: false,
                seriesName: "Exposure",
                min: 0,
                max: (max: number) => max * 2.5, // Scale to ~20% of chart height
              },
            ]
          : []),
      ],
      tooltip: {
        theme: "dark",
        x: {
          format: "dd MMM yyyy HH:mm",
        },
        y: {
          formatter: (val: number, opts?: { seriesIndex?: number }) => {
            if (opts?.seriesIndex === 1) {
              // Format exposure value
              return val.toLocaleString();
            }
            return `${formatNumber(val, 1)}%`;
          },
        },
      },
      annotations: {
        points: annotations.points,
      },
      legend: {
        show: false,
      },
      colors:
        chartData.exposureData.length > 0
          ? ["#651fff", "#3b82f6"]
          : ["#651fff"],
    }),
    [annotations, chartData, height]
  );

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
      <Chart
        options={options}
        series={series}
        type="line"
        height={height}
        width="100%"
      />
    </div>
  );
}
