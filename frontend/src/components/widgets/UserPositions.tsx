"use client";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatCurrency } from "@/lib/ui/format.utils";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useUserPositionsQuery } from "@/lib/queries/user-positions.query";
import Image from "next/image";

export function UserPositions({ userId }: { userId: string }) {
  const { data: positions, isLoading, error } = useUserPositionsQuery(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <LoadingSpinner message="Loading user positions..." size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive text-sm py-2">
        Error loading positions
      </div>
    );
  }

  if (!positions || positions.length === 0) {
    return (
      <div className="text-muted-foreground text-sm py-2">
        No positions found
      </div>
    );
  }

  const totalValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
  const totalPnl = positions.reduce((sum, pos) => sum + pos.cashPnl, 0);

  return (
    <div className="bg-muted/30 p-4 space-y-3">
      {/* Summary Stats */}
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Total Positions</div>
            <div className="text-sm font-semibold">{positions.length}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total Value</div>
            <div className="text-sm font-semibold">
              {formatCurrency(totalValue)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total PnL</div>
            <div
              className={`text-sm font-semibold ${
                totalPnl >= 0 ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {totalPnl >= 0 ? "+" : ""}
              {formatCurrency(totalPnl)}
            </div>
          </div>
        </div>
        <a
          href={`https://polymarket.com/profile/${userId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          View Profile <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Positions Grid */}
      <div className="grid gap-2 max-h-[400px] overflow-y-auto">
        {positions.map((position) => (
          <Link
            key={`${position.conditionId}-${position.asset}`}
            href={`/market/${position.slug}`}
            className="block"
          >
            <div className="bg-background/50 border border-border/50 rounded-md p-3 hover:bg-background transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {position.icon && (
                      <Image
                        src={position.icon}
                        alt=""
                        className="w-4 h-4 rounded"
                      />
                    )}
                    <div className="text-sm font-medium truncate">
                      {position.title}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs font-normal">
                      {position.outcome}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(position.size)} shares @ $
                      {formatNumber(position.avgPrice, 4)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {formatCurrency(position.currentValue)}
                  </div>
                  <div
                    className={`text-xs font-medium ${
                      position.cashPnl >= 0
                        ? "text-emerald-500"
                        : "text-rose-500"
                    }`}
                  >
                    {position.cashPnl >= 0 ? "+" : ""}
                    {formatCurrency(position.cashPnl)} (
                    {position.percentPnl >= 0 ? "+" : ""}
                    {formatNumber(position.percentPnl, 1)}%)
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
