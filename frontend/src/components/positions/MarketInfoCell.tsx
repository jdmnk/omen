"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber, formatPrice } from "@/lib/ui/format.utils";

type MarketInfoCellProps = {
  icon?: string | null;
  title: string;
  outcome?: string | null;
  outcomeIndex?: number | null;
  shares?: number | null;
  price?: number | null;
  href?: string;
};

export function MarketInfoCell({
  icon,
  title,
  outcome,
  outcomeIndex,
  shares,
  price,
  href,
}: MarketInfoCellProps) {
  const priceLabel =
    price != null ? formatPrice(price, { maximumFractionDigits: 0 }) : null;
  const isYesOutcome = outcomeIndex === 0 || outcome === "Yes";

  return (
    <div className="flex items-center gap-2 min-w-0">
      {icon && (
        <div className="relative h-8 w-8 shrink-0">
          <Image src={icon} alt="" fill className="rounded object-cover" />
        </div>
      )}
      <div className="flex flex-col min-w-0">
        {href ? (
          <a
            href={href}
            className="truncate font-medium text-sm leading-tight hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {title}
            <ExternalLink className="inline-block ml-1 h-3 w-3 opacity-50" />
          </a>
        ) : (
          <span className="truncate font-medium text-sm leading-tight">
            {title}
          </span>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {outcome && (
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-medium",
                isYesOutcome
                  ? "bg-outcome-yes/15 text-outcome-yes"
                  : "bg-outcome-no/15 text-outcome-no"
              )}
            >
              {outcome}
            </span>
          )}
          {shares != null && (
            <span>
              {formatNumber(shares, 1)} shares
              {priceLabel && ` @ ${priceLabel}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
