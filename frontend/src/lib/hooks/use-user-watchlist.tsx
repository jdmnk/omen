"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface UserWatchlistItem {
  proxyWallet: string;
  name: string;
}

interface UserWatchlistState {
  watchlist: UserWatchlistItem[];
  addToWatchlist: (item: UserWatchlistItem) => void;
  removeFromWatchlist: (proxyWallet: string) => void;
  toggleWatchlist: (item: UserWatchlistItem) => void;
  isWatchlisted: (proxyWallet: string) => boolean;
}

export const useUserWatchlistStore = create<UserWatchlistState>()(
  persist(
    (set, get) => ({
      watchlist: [],

      addToWatchlist: (item: UserWatchlistItem) => {
        set((state) => {
          if (state.watchlist.some((w) => w.proxyWallet === item.proxyWallet)) {
            return state;
          }
          return { watchlist: [...state.watchlist, item] };
        });
      },

      removeFromWatchlist: (proxyWallet: string) => {
        set((state) => ({
          watchlist: state.watchlist.filter((w) => w.proxyWallet !== proxyWallet),
        }));
      },

      toggleWatchlist: (item: UserWatchlistItem) => {
        set((state) => {
          const existingIndex = state.watchlist.findIndex(
            (w) => w.proxyWallet === item.proxyWallet
          );
          if (existingIndex >= 0) {
            return {
              watchlist: state.watchlist.filter(
                (w) => w.proxyWallet !== item.proxyWallet
              ),
            };
          } else {
            return { watchlist: [...state.watchlist, item] };
          }
        });
      },

      isWatchlisted: (proxyWallet: string) => {
        return get().watchlist.some((w) => w.proxyWallet === proxyWallet);
      },
    }),
    {
      name: "user-watchlist",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Hook for convenience
export function useUserWatchlist() {
  const watchlist = useUserWatchlistStore((state) => state.watchlist);
  const addToWatchlist = useUserWatchlistStore((state) => state.addToWatchlist);
  const removeFromWatchlist = useUserWatchlistStore(
    (state) => state.removeFromWatchlist
  );
  const toggleWatchlist = useUserWatchlistStore((state) => state.toggleWatchlist);
  const isWatchlisted = useUserWatchlistStore((state) => state.isWatchlisted);

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isWatchlisted,
  };
}

