import { Interval } from "@/lib/models/frontend.models";

export const INTERVALS: Interval[] = ["1h", "6h", "1d", "1w", "1m", "max"];

export const INTERVAL_LABELS: Record<Interval, string> = {
  "1h": "1H",
  "6h": "6H",
  "1d": "1D",
  "1w": "1W",
  "1m": "1M",
  max: "MAX",
};

export const INTERVAL_FIDELITY: Record<Interval, number> = {
  "1h": 1,
  "6h": 5,
  "1d": 15,
  "1w": 60,
  "1m": 240,
  max: 1440,
};

export const INTERVAL_DURATION_SEC: Record<Interval, number> = {
  "1h": 60 * 60,
  "6h": 6 * 60 * 60,
  "1d": 24 * 60 * 60,
  "1w": 7 * 24 * 60 * 60,
  "1m": 30 * 24 * 60 * 60,
  max: Infinity,
};
