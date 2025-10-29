"use client";

import { useUserPositionsQuery } from "@/lib/queries/user-positions.query";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatCurrency } from "@/lib/ui/format.utils";
import { ExternalLink, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MainSharedContainer } from "@/components/layouts/MainSharedContainer";

export default function UserPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: positions, isLoading, error } = useUserPositionsQuery(id);

  if (isLoading) {
    return (
      <MainSharedContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner message="Loading user positions..." size="lg" />
        </div>
      </MainSharedContainer>
    );
  }

  if (error) {
    return (
      <MainSharedContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-destructive text-lg font-semibold mb-2">
              Error loading positions
            </div>
            <div className="text-muted-foreground text-sm">
              Please try again later
            </div>
          </div>
        </div>
      </MainSharedContainer>
    );
  }

  if (!positions || positions.length === 0) {
    return (
      <MainSharedContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <div className="text-lg font-semibold mb-2">No positions found</div>
            <div className="text-muted-foreground text-sm">
              This user has no active positions
            </div>
          </div>
        </div>
      </MainSharedContainer>
    );
  }

  // TODO: use an api for this to get value of ALL positions
  const totalValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
  const totalPnl = positions.reduce((sum, pos) => sum + pos.cashPnl, 0);
  const percentPnl =
    totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;

  return (
    <MainSharedContainer>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">User Portfolio</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <code className="text-xs bg-muted px-2 py-1 rounded">{id}</code>
              <a
                href={`https://polymarket.com/profile/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground flex items-center gap-1 text-sm"
              >
                View on Polymarket <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Positions
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-2xl font-bold">{positions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-2xl font-bold">
                {formatCurrency(totalValue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total PnL
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`text-2xl font-bold ${
                    totalPnl >= 0 ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {totalPnl >= 0 ? "+" : ""}
                  {formatCurrency(totalPnl)}
                </div>
                {totalPnl >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-rose-500" />
                )}
              </div>
              <p
                className={`text-xs mt-1 ${
                  totalPnl >= 0 ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {percentPnl >= 0 ? "+" : ""}
                {formatNumber(percentPnl, 2)}% return
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Positions Grid */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>All Positions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-2">
              {positions.map((position) => (
                <Link
                  key={`${position.conditionId}-${position.asset}`}
                  href={`/market/${position.slug}`}
                  className="block"
                >
                  <div className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          {position.icon && (
                            <img
                              src={position.icon}
                              alt=""
                              className="w-5 h-5 rounded"
                            />
                          )}
                          <div className="font-semibold truncate text-sm">
                            {position.title}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-xs font-normal"
                          >
                            {position.outcome}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatNumber(position.size)} shares @ $
                            {formatNumber(position.avgPrice, 4)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Current: ${formatNumber(position.curPrice, 4)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold mb-0.5">
                          {formatCurrency(position.currentValue)}
                        </div>
                        <div
                          className={`text-sm font-semibold ${
                            position.cashPnl >= 0
                              ? "text-emerald-500"
                              : "text-rose-500"
                          }`}
                        >
                          {position.cashPnl >= 0 ? "+" : ""}
                          {formatCurrency(position.cashPnl)}
                        </div>
                        <div
                          className={`text-xs ${
                            position.percentPnl >= 0
                              ? "text-emerald-500"
                              : "text-rose-500"
                          }`}
                        >
                          {position.percentPnl >= 0 ? "+" : ""}
                          {formatNumber(position.percentPnl, 2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainSharedContainer>
  );
}
