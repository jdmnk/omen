"use client";

import { create } from "zustand";
import type { Interval } from "@/lib/models/frontend.models";
import type { SeriesMarker, Time } from "lightweight-charts";

type ChartPoint = { time: number | string; value: number };

export type SharedMarketSnapshot = {
  chartData: ChartPoint[];
  markers: SeriesMarker<Time>[];
  interval: Interval;
  positionTitle?: string | null;
  positionOutcome?: string | null;
  positionValue: number;
  marketUrl?: string | null;
  outcomeClassName?: string | null;
};

type MarketShareState = {
  snapshot: SharedMarketSnapshot | null;
  isOpen: boolean;
  openWithSnapshot: (snapshot: SharedMarketSnapshot) => void;
  setOpen: (open: boolean) => void;
};

export const useMarketShareStore = create<MarketShareState>((set) => ({
  snapshot: null,
  isOpen: false,
  openWithSnapshot: (snapshot) => set({ snapshot, isOpen: true }),
  setOpen: (open) =>
    set((state) => ({
      isOpen: open,
      snapshot: open ? state.snapshot : null,
    })),
}));
