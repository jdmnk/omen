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
import { UserHoldingsSummary } from "@/lib/models/api.models";
import Link from "next/link";

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
                <TableHead className="w-[40%]">Wallet</TableHead>
                <TableHead className="text-right">Holdings</TableHead>
                <TableHead className="text-right">Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u: UserHoldingsSummary) => (
                <TableRow key={u.proxyWallet}>
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
                    {u.totalHoldings.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {u.totalVolume.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
