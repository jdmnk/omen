"use client";

import { useRecentTradesQuery } from "@/lib/queries/recent-trades.query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/spinner";
import { RecentActivity } from "./RecentActivity";
import { Activity } from "lucide-react";

export function RecentActivityWidget({
  conditionId,
  minAmount = 10,
}: {
  conditionId: string;
  minAmount?: number;
}) {
  const {
    data: trades,
    isLoading,
    error,
  } = useRecentTradesQuery(conditionId, minAmount);

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner message="Loading trades..." size="sm" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive text-sm">
            Error loading trades
          </div>
        ) : (
          <RecentActivity trades={trades || []} />
        )}
      </CardContent>
    </Card>
  );
}
