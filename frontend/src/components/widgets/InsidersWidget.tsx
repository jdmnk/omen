"use client";
import { useTopHoldersQuery } from "@/lib/queries/top-holders.query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function InsidersWidget({ conditionId }: { conditionId: string }) {
  const { data, isLoading, error } = useTopHoldersQuery(conditionId);
  console.log(data);

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Insiders</CardTitle>
      </CardHeader>
      <CardContent>
        <div>{JSON.stringify(data, null, 2)}</div>
      </CardContent>
    </Card>
  );
}
