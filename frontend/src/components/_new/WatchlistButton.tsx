"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWatchlist, type WatchlistItem } from "@/lib/hooks/use-watchlist";

export function WatchlistButton({
  slug,
  conditionId,
  title,
}: {
  slug: string;
  conditionId: string;
  title: string;
}) {
  const { isWatchlisted, toggleWatchlist } = useWatchlist();
  const isWatchlistedValue = isWatchlisted(slug);

  const handleToggle = () => {
    toggleWatchlist({
      slug,
      conditionId,
      title,
    });
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleToggle();
      }}
      className={cn(
        "transition-all duration-200",
        "hover:scale-110 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      )}
      aria-label={
        isWatchlistedValue ? "Remove from watchlist" : "Add to watchlist"
      }
    >
      <Star
        className={cn(
          "h-4 w-4 transition-all duration-200",
          isWatchlistedValue
            ? "fill-yellow-400 text-yellow-400"
            : "fill-none text-muted-foreground hover:text-yellow-400"
        )}
      />
    </button>
  );
}
