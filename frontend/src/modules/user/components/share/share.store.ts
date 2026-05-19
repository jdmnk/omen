"use client";

import { create } from "zustand";
import type { Interval, ProcessedActivity } from "@/lib/models/frontend.models";
import { Position } from "@/lib/models/frontend.models";

export type SharedMarketSnapshot = {
  interval: Interval;
  position: Position;
  entries: ProcessedActivity[];
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
