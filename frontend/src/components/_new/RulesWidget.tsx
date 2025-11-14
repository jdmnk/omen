"use client";

import React from "react";
import Linkify from "linkify-react";
import { useClarificationsQuery } from "@/lib/queries/clarifications.query";
import { Market } from "@/lib/models/api.models";

interface RulesWidgetProps {
  market: Market;
}

function isUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export function RulesWidget({ market }: RulesWidgetProps) {
  const { questionId, marketMakerAddress, description } = market;
  const {
    data: updates,
    isLoading,
    error,
  } = useClarificationsQuery(questionId, marketMakerAddress);

  return (
    <div className="space-y-4 p-4">
      {/* Market Description Section */}
      {description && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Market Description</h3>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {description ? (
              <Linkify
                options={{
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "text-primary hover:underline",
                }}
              >
                {description}
              </Linkify>
            ) : (
              "No description available."
            )}
          </div>
          {market.resolutionSource && (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              Resolution source:{" "}
              {isUrl(market.resolutionSource) ? (
                <a
                  href={market.resolutionSource}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {market.resolutionSource}
                </a>
              ) : (
                market.resolutionSource
              )}
            </div>
          )}
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
                  {update.text && update.text.length > 0 ? (
                    <div className="text-sm whitespace-pre-wrap">
                      {update.text}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No content available.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
