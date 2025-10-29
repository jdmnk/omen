import { Trade } from "@/lib/models/api.models";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatCurrency } from "@/lib/ui/format.utils";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

export function RecentActivity({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No recent trades
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {trades.map((trade, index) => {
        const isBuy = trade.side === "BUY";
        const value = trade.size * trade.price;

        return (
          <Link
            key={`${trade.transactionHash}-${index}`}
            href={`/user/${trade.proxyWallet}`}
            className="block"
          >
            <div className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <div
                    className={`mt-0.5 ${
                      isBuy ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {isBuy ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {trade.profileImageOptimized && (
                        <img
                          src={trade.profileImageOptimized}
                          alt=""
                          className="w-4 h-4 rounded-full"
                        />
                      )}
                      <span className="text-sm font-medium truncate">
                        {trade.name || trade.pseudonym || "Anonymous"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs font-normal">
                        {isBuy ? "Buy" : "Sell"} {trade.outcome}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatNumber(trade.size)} @ $
                        {formatNumber(trade.price, 4)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {formatCurrency(value)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTimestamp(trade.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
