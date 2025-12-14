"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserWatchlist } from "@/lib/hooks/use-user-watchlist";

export function UserWatchlistButton({
  proxyWallet,
  name,
  className,
}: {
  proxyWallet: string;
  name: string;
  className?: string;
}) {
  const { isWatchlisted, toggleWatchlist } = useUserWatchlist();
  const isWatchlistedValue = isWatchlisted(proxyWallet);

  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist({
      proxyWallet,
      name,
    });
  };

  return (
    <div
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleToggle(e);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={
        isWatchlistedValue ? "Remove from watchlist" : "Add to watchlist"
      }
      className={cn(
        "transition-all duration-200",
        "hover:scale-110 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
        "cursor-pointer",
        className
      )}
    >
      <Star
        className={cn(
          "h-4 w-4 transition-all duration-200",
          isWatchlistedValue
            ? "fill-yellow-400 text-yellow-400"
            : "fill-none text-muted-foreground hover:text-yellow-400"
        )}
      />
    </div>
  );
}

