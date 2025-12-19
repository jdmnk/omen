"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { useTopMoversQuery, TopMover } from "../lib/queries/top-movers.query";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

function formatPriceDelta(delta: number | null): string {
  if (delta === null) return "—";
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${(delta * 100).toFixed(1)}%`;
}

function formatPrice(price: number | null): string {
  if (price === null) return "—";
  return `${(price * 100).toFixed(1)}¢`;
}

function MoverRow({
  mover,
  onClick,
}: {
  mover: TopMover;
  onClick: () => void;
}) {
  const isPositive = (mover.price_delta ?? 0) >= 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3",
        "transition-colors hover:bg-brand-background cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "border-b border-brand-stroke last:border-b-0"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="shrink-0">
          {mover.icon ? (
            <Image
              src={mover.icon}
              alt=""
              width={32}
              height={32}
              className="rounded-md border object-contain"
            />
          ) : (
            <div className="w-8 h-8 rounded-md border bg-muted/30" />
          )}
        </div>

        {/* Question */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{mover.question}</p>
        </div>

        {/* Price */}
        <div className="shrink-0 text-right w-16">
          <span className="text-sm font-medium text-muted-foreground">
            {formatPrice(mover.last_price)}
          </span>
        </div>

        {/* Delta */}
        <div
          className={cn(
            "shrink-0 flex items-center gap-1 w-20 justify-end",
            isPositive ? "text-green-500" : "text-red-500"
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span className="text-sm font-semibold">
            {formatPriceDelta(mover.price_delta)}
          </span>
        </div>
      </div>
    </button>
  );
}

export function TopMoversWidget() {
  const router = useRouter();
  const { data, isLoading, error } = useTopMoversQuery(30);

  const handleSelectMarket = (slug: string) => {
    router.push(`/market/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="md" />
          <span className="text-sm text-muted-foreground">
            Loading top movers...
          </span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-sm text-muted-foreground">
          Unable to load top movers
        </span>
      </div>
    );
  }

  const lastUpdated = new Date(data.fetched_at).toLocaleString();

  return (
    <div className="h-full flex flex-col border border-brand-stroke rounded-brand overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-brand-stroke bg-brand-background/50">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Top Movers</h2>
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Updated {lastUpdated}</span>
            </div>
          )}
        </div>
      </div>

      {/* Column Headers */}
      <div className="shrink-0 px-4 py-2 border-b border-brand-stroke bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-8" /> {/* Icon spacer */}
          <div className="flex-1 min-w-0">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Market
            </span>
          </div>
          <div className="w-16 text-right">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Price
            </span>
          </div>
          <div className="w-20 text-right">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Change
            </span>
          </div>
        </div>
      </div>

      {/* Movers List */}
      <div className="flex-1 overflow-auto">
        {data.movers.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <span className="text-sm text-muted-foreground italic">
              No price movements yet
            </span>
          </div>
        ) : (
          data.movers.map((mover) => (
            <MoverRow
              key={mover.clob_token_id}
              mover={mover}
              onClick={() => handleSelectMarket(mover.slug)}
            />
          ))
        )}
      </div>
    </div>
  );
}
