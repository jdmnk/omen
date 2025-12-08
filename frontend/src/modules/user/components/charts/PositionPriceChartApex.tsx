"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { SeriesMarker, Time, HistogramData } from "lightweight-charts";
import { Spinner } from "@/components/ui/spinner";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ChartPoint = { time: number | string; value: number };

type PositionPriceChartApexProps = {
  data: ChartPoint[];
  markers?: SeriesMarker<Time>[];
  volumeBars?: HistogramData<Time>[];
  error?: Error | null;
  isLoading?: boolean;
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
  // Handle BusinessDay type (shouldn't happen in practice, but handle it)
  return Date.now();
}

export function PositionPriceChartApex({
  data,
  markers = [],
  volumeBars = [],
  error,
  isLoading,
}: PositionPriceChartApexProps) {
  const CHART_HEIGHT = 360;

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

    // Find min/max for positioning
    const values = data.map((p) => p.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    const points = markers.map((marker) => {
      const x = convertTimeToTimestamp(marker.time);
      // Find closest data point for y value
      let y = data[0]?.value ?? 0;
      let closestTime = convertTimeToTimestamp(data[0]?.time ?? 0);
      let minDiff = Infinity;

      data.forEach((point) => {
        const pointTime = convertTimeToTimestamp(point.time);
        const diff = Math.abs(pointTime - x);
        if (diff < minDiff) {
          minDiff = diff;
          closestTime = pointTime;
          y = point.value;
        }
      });

      // Markers should be drawn ON THE LINE at the actual y value
      // The position property is used for label placement, but marker is on the line
      const yPosition = y;

      return {
        x,
        y: yPosition,
        marker: {
          size: marker.size ? marker.size * 4 : 6,
          fillColor: marker.color || "#651fff",
          strokeColor: marker.color || "#651fff",
          strokeWidth: 2,
          shape: marker.shape === "square" ? "square" : "circle",
          radius: marker.size ? marker.size * 2 : 3,
        },
        label: marker.text
          ? {
              text: marker.text,
              textAnchor: "middle",
              position: marker.position === "belowBar" ? "bottom" : "top",
              offsetY: marker.position === "belowBar" ? -8 : 8,
              style: {
                color: "#9ca3af",
                fontSize: "11px",
                fontWeight: 400,
                background: "transparent",
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
        yAxisIndex: 1,
      } as ApexAxisChartSeries[number] & { curve?: string });
    }

    return seriesArray;
  }, [chartData]);

  const options: ApexCharts.ApexOptions = useMemo(
    () => ({
      chart: {
        type: "line",
        height: CHART_HEIGHT,
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
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve:
          chartData.exposureData.length > 0
            ? ["straight", "stepline"]
            : "straight",
        width: chartData.exposureData.length > 0 ? [2, 1] : 2,
        colors:
          chartData.exposureData.length > 0
            ? ["#651fff", "#3b82f6"]
            : ["#651fff"],
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0,
          stops: [0, 100],
          colorStops: [
            {
              offset: 0,
              color: "#341084",
              opacity: 0.7,
            },
            {
              offset: 100,
              color: "rgba(101, 31, 255, 0)",
              opacity: 0,
            },
          ],
        },
        opacity: [0.7, 0.3],
      },
      grid: {
        show: false,
        borderColor: "transparent",
      },
      xaxis: {
        type: "datetime",
        labels: {
          style: {
            colors: "#9ca3af",
            fontSize: "11px",
          },
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
              colors: "#9ca3af",
              fontSize: "11px",
            },
            formatter: (val: number) => val.toFixed(2),
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
                max: (max: number) => max * 2, // Scale to ~20% of chart height
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
            return val.toFixed(2);
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
    [annotations, chartData.exposureData.length]
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
      {typeof window !== "undefined" && (
        <Chart
          options={options}
          series={series}
          type="line"
          height={CHART_HEIGHT}
          width="100%"
        />
      )}
    </div>
  );
}
