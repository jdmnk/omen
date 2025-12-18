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
    <div className="flex flex-wrap items-center gap-2">
      {/* <span className="text-xs text-muted-foreground font-medium shrink-0">
        Watchlist ({watchlist.length})
      </span> */}
      {displayItems.map((user) => (
        <Link
          key={user.proxyWallet}
          href={`/user/${user.proxyWallet}`}
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-md",
            "border border-brand-stroke",
            "transition-colors",
            "hover:bg-brand-highlight/20 cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <UserWatchlistButton
            proxyWallet={user.proxyWallet}
            name={user.name}
            className="shrink-0"
          />
          <span className="font-medium">
            {user.name || formatAddress(user.proxyWallet)}
          </span>
        </Link>
      ))}
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {isExpanded ? (
            <>
              <span>Show less</span>
              <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              <span>+{remainingCount} more</span>
              <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
