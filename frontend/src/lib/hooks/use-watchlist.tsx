"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface WatchlistItem {
  slug: string;
  conditionId: string;
  title: string;
  description?: string;
}

interface WatchlistState {
  watchlist: WatchlistItem[];
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (slug: string) => void;
  toggleWatchlist: (item: WatchlistItem) => void;
  isWatchlisted: (slug: string) => boolean;
  // Helper to get conditionIds for queries
  getConditionIds: () => string[];
  reorderWatchlist: (oldIndex: number, newIndex: number) => void;
  updateDescription: (slug: string, description?: string) => void;
  setWatchlist: (items: WatchlistItem[]) => void;
}

// Migration function to handle old format (array of strings)
function migrateWatchlist(oldData: unknown): WatchlistItem[] {
  if (!Array.isArray(oldData)) {
    return [];
  }

  // Check if it's the old format (array of strings)
  if (oldData.length > 0 && typeof oldData[0] === "string") {
    // Migrate old format: convert strings to objects with just slug
    // conditionId and title will be empty and filled when market data loads
    return (oldData as string[]).map((slug) => ({
      slug,
      conditionId: "",
      title: "",
    }));
  }

  // Already in new format or empty array
  return oldData as WatchlistItem[];
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watchlist: [],

      addToWatchlist: (item: WatchlistItem) => {
        set((state) => {
          if (state.watchlist.some((w) => w.slug === item.slug)) {
            return state;
          }
          return { watchlist: [...state.watchlist, item] };
        });
      },

      removeFromWatchlist: (slug: string) => {
        set((state) => ({
          watchlist: state.watchlist.filter((w) => w.slug !== slug),
        }));
      },

      toggleWatchlist: (item: WatchlistItem) => {
        set((state) => {
          const existingIndex = state.watchlist.findIndex(
            (w) => w.slug === item.slug
          );
          if (existingIndex >= 0) {
            return {
              watchlist: state.watchlist.filter((w) => w.slug !== item.slug),
            };
          } else {
            return { watchlist: [...state.watchlist, item] };
          }
        });
      },

      isWatchlisted: (slug: string) => {
        return get().watchlist.some((w) => w.slug === slug);
      },

      getConditionIds: () => {
        return get().watchlist.map((w) => w.conditionId);
      },

      reorderWatchlist: (oldIndex: number, newIndex: number) => {
        set((state) => {
          const items = [...state.watchlist];
          const [removed] = items.splice(oldIndex, 1);
          items.splice(newIndex, 0, removed);
          return { watchlist: items };
        });
      },

      updateDescription: (slug: string, description?: string) => {
        set((state) => ({
          watchlist: state.watchlist.map((item) =>
            item.slug === slug
              ? { ...item, description: description || undefined }
              : item
          ),
        }));
      },

      setWatchlist: (items: WatchlistItem[]) => {
        set({ watchlist: items });
      },
    }),
    {
      name: "omen-watchlist",
      storage: createJSONStorage(() => localStorage),
      // Migration: handle old format (array of strings) to new format (array of objects)
      migrate: (persistedState: any) => {
        if (persistedState?.state?.watchlist) {
          return {
            ...persistedState,
            state: {
              ...persistedState.state,
              watchlist: migrateWatchlist(persistedState.state.watchlist),
            },
          };
        }
        return persistedState;
      },
    }
  )
);

// Hook for convenience - maintains the same API
export function useWatchlist() {
  const watchlist = useWatchlistStore((state) => state.watchlist);
  const addToWatchlist = useWatchlistStore((state) => state.addToWatchlist);
  const removeFromWatchlist = useWatchlistStore(
    (state) => state.removeFromWatchlist
  );
  const toggleWatchlist = useWatchlistStore((state) => state.toggleWatchlist);
  const isWatchlisted = useWatchlistStore((state) => state.isWatchlisted);
  const getConditionIds = useWatchlistStore((state) => state.getConditionIds);
  const reorderWatchlist = useWatchlistStore(
    (state) => state.reorderWatchlist
  );
  const updateDescription = useWatchlistStore(
    (state) => state.updateDescription
  );
  const setWatchlist = useWatchlistStore((state) => state.setWatchlist);

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isWatchlisted,
    getConditionIds,
    reorderWatchlist,
    updateDescription,
    setWatchlist,
  };
}
