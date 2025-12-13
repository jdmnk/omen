"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { SeriesMarker, Time } from "lightweight-charts";
import { Spinner } from "@/components/ui/spinner";
import { formatNumber } from "@/lib/ui/format.utils";
import type { ExposureAreaPoint } from "../../lib/chart/exposure-area.utils";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ChartPoint = { time: number | string; value: number };

type ChartColors = {
  /** Main price line color */
  lineColor: string;
  /** Gradient stops: [fromColor, toColor] */
  gradientColors: [string, string];
  /** Exposure line color */
  exposureLineColor: string;
  /** Exposure fill color */
  exposureFillColor: string;
  /** Marker border color */
  markerBorderColor: string;
};

type ChartOptions = {
  chartHeight: number;
  labelColor: string;
  colors?: ChartColors;
};

// Accept lightweight-charts types for compatibility
type PositionPriceChartApexProps = {
  data: ChartPoint[];
  markers?: SeriesMarker<Time>[];
  volumeBars?: ExposureAreaPoint[];
  error?: Error | null;
  isLoading?: boolean;
  chartOptions?: ChartOptions;
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

const DEFAULT_COLORS: ChartColors = {
  lineColor: "#651fff",
  gradientColors: ["rgba(101, 31, 255, 0.6)", "rgba(26, 5, 51, 0.05)"],
  exposureLineColor: "#651fff",
  exposureFillColor: "rgba(101, 31, 255, 0.2)",
  markerBorderColor: "#651fff",
};

export function PositionPriceChartApex({
  data,
  markers = [],
  volumeBars = [],
  error,
  isLoading,
  chartOptions = {
    chartHeight: 360,
    labelColor: "#949ba6",
  },
}: PositionPriceChartApexProps) {
  const colors = chartOptions.colors ?? DEFAULT_COLORS;
  const chartData = useMemo(() => {
    const priceData = data.map((point) => [
      convertTimeToTimestamp(point.time),
      point.value,
    ]);

    // Calculate price data time range for x-axis bounds
    const priceTimestamps = priceData.map(([time]) => time as number);
    const minPriceTime = Math.min(...priceTimestamps);
    const maxPriceTime = Math.max(...priceTimestamps);

    // Sort exposure data by time for proper stepline clipping
    const allExposurePoints = volumeBars
      .map((bar) => [convertTimeToTimestamp(bar.time), bar.value] as const)
      .sort((a, b) => a[0] - b[0]);

    // For stepline: keep one anchor point before minPriceTime (to draw the horizontal
    // line into the visible range) plus all points from minPriceTime onwards.
    // This clips old history while preserving correct stepline rendering.
    const firstVisibleIdx = allExposurePoints.findIndex(
      ([time]) => time >= minPriceTime
    );
    const startIdx =
      firstVisibleIdx === -1
        ? allExposurePoints.length // No visible points - empty result
        : firstVisibleIdx > 0
        ? firstVisibleIdx - 1 // Include one anchor point before
        : 0;
    const exposureData = allExposurePoints.slice(startIdx);

    // Calculate the actual max time for x-axis (max of price data and exposure data)
    const maxExposureTime =
      exposureData.length > 0
        ? Math.max(...exposureData.map(([time]) => time))
        : maxPriceTime;
    const actualMaxTime = Math.max(maxPriceTime, maxExposureTime);

    return {
      priceData,
      exposureData,
      minPriceTime,
      maxPriceTime,
      actualMaxTime,
    };
  }, [data, volumeBars]);

  const annotations = useMemo(() => {
    if (!markers.length || !chartData.priceData.length) return { points: [] };

    const { priceData, minPriceTime, maxPriceTime } = chartData;

    // Filter markers within price data range
    const filteredMarkers = markers.filter((marker) => {
      const markerTime = convertTimeToTimestamp(marker.time);
      return markerTime >= minPriceTime && markerTime <= maxPriceTime;
    });

    const points = filteredMarkers.map((marker) => {
      const x = convertTimeToTimestamp(marker.time);

      // Find y-value by interpolating between adjacent data points
      let y = priceData[0]?.[1] ?? 0;

      // Find the two points that bracket the marker time
      for (let i = 0; i < priceData.length - 1; i++) {
        const [time1, value1] = priceData[i];
        const [time2, value2] = priceData[i + 1];
        const t1 = time1 as number;
        const t2 = time2 as number;

        if (x >= t1 && x <= t2) {
          // Linear interpolation
          if (t2 === t1) {
            y = value1;
          } else {
            const ratio = (x - t1) / (t2 - t1);
            y = value1 + (value2 - value1) * ratio;
          }
          break;
        } else if (x < t1 && i === 0) {
          // Before first point
          y = value1;
          break;
        } else if (x > t2 && i === priceData.length - 2) {
          // After last point
          y = value2;
          break;
        }
      }

      const markerSize = marker.size
        ? Math.max(1, Math.min(marker.size * 4, 12))
        : 6;
      const markerColor = marker.color || colors.lineColor;

      return {
        x,
        y,
        marker: {
          size: markerSize,
          fillColor: markerColor,
          strokeColor: colors.markerBorderColor,
          strokeWidth: 2,
          shape: marker.shape === "square" ? "square" : "circle",
        },
        label: marker.text
          ? {
              text: marker.text,
              textAnchor: "middle",
              position: marker.position === "belowBar" ? "bottom" : "top",
              offsetY: marker.position === "belowBar" ? -8 : 8,
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
  }, [markers, chartData, colors]);

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
        height: chartOptions.chartHeight,
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
        width: chartData.exposureData.length > 0 ? [2, 1] : 2,
        colors: [colors.lineColor, colors.exposureLineColor],
      },
      fill: {
        type: ["gradient", "solid"],
        gradient: {
          type: "vertical",
          shadeIntensity: 1,
          opacityFrom: 0.85,
          opacityTo: 0.05,
          stops: [0, 100],
          colorStops: [
            [
              { offset: 0, color: colors.gradientColors[0], opacity: 1 },
              { offset: 100, color: colors.gradientColors[1], opacity: 1 },
            ],
          ],
        },
        colors: [colors.lineColor, colors.exposureFillColor],
        opacity: [1, 1],
      },

      grid: {
        show: true,
        borderColor: "rgba(80, 93, 124, 0.3)",
        strokeDashArray: 2,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
        row: {
          colors: undefined,
        },
        column: {
          colors: undefined,
        },
        padding: {
          top: 0,
          left: 0,
          right: -10,
          bottom: 0,
        },
      },
      xaxis: {
        type: "datetime",
        min:
          chartData.priceData.length > 0 ? chartData.minPriceTime : undefined,
        max:
          chartData.priceData.length > 0 ? chartData.actualMaxTime : undefined,
        labels: {
          style: {
            colors: chartOptions.labelColor,
            fontSize: "11px",
          },
          hideOverlappingLabels: true,
          offsetX: 0,
          offsetY: 0,
          trim: false,
        },
        axisBorder: {
          show: true,
          color: colors.lineColor,
          height: 1,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: [
        {
          labels: {
            style: {
              colors: chartOptions.labelColor,
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
      colors: [colors.lineColor],
    }),
    [annotations, chartData, chartOptions, colors]
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
        height={chartOptions.chartHeight}
        width="100%"
      />
    </div>
  );
}
