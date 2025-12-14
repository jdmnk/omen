"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useUserWatchlist } from "@/lib/hooks/use-user-watchlist";
import { cn } from "@/lib/utils";
import { UserWatchlistButton } from "./UserWatchlistButton";
import { formatAddress } from "@/lib/ui/format.utils";

const INITIAL_LIMIT = 10;

export function UserWatchlist() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { watchlist } = useUserWatchlist();

  if (watchlist.length === 0) {
    return null;
  }

  const displayItems = isExpanded
    ? watchlist
    : watchlist.slice(0, INITIAL_LIMIT);
  const hasMore = watchlist.length > INITIAL_LIMIT;
  const remainingCount = watchlist.length - INITIAL_LIMIT;

  return (
    <div className="border border-brand-stroke rounded-lg">
      {/* Section Header */}
      <div className="w-full flex items-center justify-between px-3 py-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 flex items-center justify-between text-xs text-brand-foreground hover:text-brand-foreground/80 transition-colors cursor-pointer"
        >
          <span className="font-medium">Watchlist ({watchlist.length})</span>
          {hasMore && (
            <div className="flex items-center gap-1">
              {isExpanded ? (
                <>
                  <span className="text-xs">Show less</span>
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span className="text-xs">Show {remainingCount} more</span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </div>
          )}
        </button>
      </div>

      {/* Watchlist Items */}
      <div className="space-y-1 pb-2">
        {displayItems.map((user) => (
          <Link
            key={user.proxyWallet}
            href={`/user/${user.proxyWallet}`}
            className={cn(
              "w-full text-left px-3 py-2 text-xs block",
              "transition-colors",
              "hover:bg-brand-background cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <div className="flex gap-3 items-center">
              {/* Star Icon - Clickable to unwatchlist */}
              <UserWatchlistButton
                proxyWallet={user.proxyWallet}
                name={user.name}
                className="shrink-0"
              />

              {/* Name */}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {user.name || formatAddress(user.proxyWallet)}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

