"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { useTopMoversQuery, TopMover } from "../lib/queries/top-movers.query";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  TABLE_HEADER_CLASSES,
  TABLE_HEADER_CONTAINER_CLASSES,
  TABLE_CONTENT_CONTAINER_CLASSES,
  TABLE_ROW_CLASSES,
} from "../../../components/shared-table-styles";

function formatPriceDelta(delta: number | null): string {
  if (delta === null) return "—";
  const sign = delta >= 0 ? "+" : "";
  const truncated = Math.trunc(delta * 1000) / 10;
  return `${sign}${truncated.toFixed(1)}%`;
}

function formatPrice(price: number | null): string {
  if (price === null) return "—";
  const truncated = Math.trunc(price * 1000) / 10;
  return `${truncated.toFixed(1)}¢`;
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
        "w-full text-left",
        "transition-colors hover:bg-brand-highlight/30 cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        TABLE_ROW_CLASSES
      )}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="shrink-0">
          {mover.icon ? (
            <div className="relative w-8 h-8">
              <Image
                src={mover.icon}
                alt=""
                fill
                sizes="32px"
                className="rounded-md border object-cover"
              />
            </div>
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
            isPositive ? "text-outcome-yes" : "text-outcome-no"
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
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-3 pt-3 pb-2 border-b border-brand-stroke">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase text-brand-primary pb-[3px]">
            Top Movers
          </h2>
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Updated {lastUpdated}</span>
            </div>
          )}
        </div>
      </div>

      {/* Column Headers */}
      <div className={TABLE_HEADER_CONTAINER_CLASSES}>
        <div className={cn("flex items-center gap-3", TABLE_HEADER_CLASSES)}>
          <div className="w-8" />
          <div className="flex-1 min-w-0">Market</div>
          <div className="w-16 text-right">Price</div>
          <div className="w-20 text-right">Change</div>
        </div>
      </div>

      {/* Movers List */}
      <div className={cn("flex-1 overflow-auto", TABLE_CONTENT_CONTAINER_CLASSES)}>
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
    </Card>
  );
}
