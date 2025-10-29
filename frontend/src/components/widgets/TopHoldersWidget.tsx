"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useTradesAnalyticsQuery } from "@/lib/queries/trades-analytics.query";
import { Trade, UserTradesGroup } from "@/lib/models/api.models";
import Link from "next/link";
import { useState } from "react";

function formatAddress(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function TopHoldersWidget({
  conditionId,
  limit = 15,
}: {
  conditionId: string;
  limit?: number;
}) {
  const { data, isLoading, error } = useTradesAnalyticsQuery(conditionId);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const rows = (data || []).slice(0, limit);

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Top Holders (by current holdings)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner message="Loading holders..." size="sm" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive text-sm">
            Error loading holders
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No holder data
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Wallet</TableHead>
                <TableHead className="text-right">Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u: UserTradesGroup) => (
                <>
                  <TableRow
                    key={u.proxyWallet}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() =>
                      setOpen((s) => ({
                        ...s,
                        [u.proxyWallet]: !s[u.proxyWallet],
                      }))
                    }
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/user/${u.proxyWallet}`}
                        className="hover:underline"
                      >
                        <div className="flex flex-col">
                          <span>
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
                    </TableCell>
                    <TableCell className="text-right">
                      {u.totalVolume.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  {open[u.proxyWallet] && (
                    <TableRow>
                      <TableCell colSpan={2} className="bg-muted/30 p-0">
                        <div className="p-3 space-y-2">
                          {u.trades.map((t: Trade, idx: number) => (
                            <div
                              key={t.transactionHash || idx}
                              className="flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={
                                    t.side === "BUY"
                                      ? "text-emerald-600"
                                      : t.side === "SELL"
                                      ? "text-rose-600"
                                      : "text-muted-foreground"
                                  }
                                >
                                  {t.side}
                                </span>
                                <span className="truncate text-muted-foreground">
                                  {t.outcome}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span>
                                  {Number(t.size).toFixed(2)} @{" "}
                                  {Number(t.price).toFixed(4)}
                                </span>
                                <span className="text-muted-foreground">
                                  {new Date(
                                    (t.timestamp || 0) * 1000
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
