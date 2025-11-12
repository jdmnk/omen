"use client";

import React from "react";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useOnchainUpdatesQuery } from "@/lib/queries/onchain-updates.query";
import { formatAddress } from "@/lib/ui/format.utils";

interface RulesWidgetProps {
  questionId?: string;
  owner?: string;
  marketDescription?: string;
}

export function RulesWidget({
  questionId,
  owner,
  marketDescription,
}: RulesWidgetProps) {
  console.log("questionId", questionId);
  console.log("owner", owner);
  const {
    data: updates,
    isLoading,
    error,
  } = useOnchainUpdatesQuery(questionId, owner);

  return (
    <div className="space-y-4 p-4">
      {/* Market Description Section */}
      {marketDescription && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Market Description</h3>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {marketDescription || "No description available."}
          </div>
        </div>
      )}

      <div>
        {updates && updates.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Additional Context</h3>
            <div className="space-y-3">
              {updates.map((update, index) => (
                <div
                  key={index}
                  className="border rounded-md p-3 space-y-2 bg-muted/50"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Update #{index + 1}</span>
                    <span>
                      {new Date(update.timestamp * 1000).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm break-all font-mono">
                    {update.update}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
