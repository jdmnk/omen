"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useTradesAnalyticsQuery } from "@/lib/queries/trades-analytics.query";
import { Trade, UserTradesGroup } from "@/lib/models/api.models";
import { formatNumber, formatCurrency } from "@/lib/ui/format.utils";
import Link from "next/link";
import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
} from "lucide-react";

function formatAddress(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

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

export function TopHoldersWidget({
  conditionId,
  limit = 15,
}: {
  conditionId: string;
  limit?: number;
}) {
  const { data, isLoading, error } = useTradesAnalyticsQuery(conditionId);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (wallet: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(wallet)) {
        next.delete(wallet);
      } else {
        next.add(wallet);
      }
      return next;
    });
  };

  const rows = (data || []).slice(0, limit);

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Top Traders
          </CardTitle>
          {!isLoading && rows.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {rows.length} {rows.length === 1 ? "trader" : "traders"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner message="Loading traders..." size="sm" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive text-sm">
            Error loading traders
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No trader data
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((u: UserTradesGroup) => {
              const isExpanded = expandedRows.has(u.proxyWallet);
              return (
                <div
                  key={u.proxyWallet}
                  className="border border-border rounded-lg overflow-hidden transition-all"
                >
                  <div
                    className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => toggleRow(u.proxyWallet)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-muted-foreground">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                        <Link
                          href={`/user/${u.proxyWallet}`}
                          className="flex items-center gap-2.5 flex-1 min-w-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {u.profileImage && (
                            <img
                              src={u.profileImage}
                              alt=""
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate hover:underline">
                              {(
                                u.name ||
                                u.pseudonym ||
                                formatAddress(u.proxyWallet)
                              ).slice(0, 20)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatAddress(u.proxyWallet)}
                            </span>
                          </div>
                        </Link>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {formatCurrency(u.totalVolume)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {u.trades.length}{" "}
                          {u.trades.length === 1 ? "trade" : "trades"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border bg-muted/30 p-3">
                      <div className="space-y-2">
                        {u.trades.map((t: Trade, idx: number) => {
                          const isBuy = t.side === "BUY";
                          const value = t.size * t.price;

                          return (
                            <div
                              key={t.transactionHash || idx}
                              className="flex items-start justify-between gap-3 py-2 border-b border-border/50 last:border-0"
                            >
                              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                <div
                                  className={`mt-0.5 ${
                                    isBuy ? "text-emerald-500" : "text-rose-500"
                                  }`}
                                >
                                  {isBuy ? (
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  ) : (
                                    <ArrowDownLeft className="w-3.5 h-3.5" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge
                                      variant="outline"
                                      className="text-xs font-normal"
                                    >
                                      {isBuy ? "Buy" : "Sell"} {t.outcome}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatNumber(t.size)} @ $
                                    {formatNumber(t.price, 4)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-semibold">
                                  {formatCurrency(value)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatTimestamp(t.timestamp)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
