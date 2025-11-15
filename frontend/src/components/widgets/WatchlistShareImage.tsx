"use client";

import type { WatchlistMarket } from "@/lib/utils/share-watchlist.utils";

interface WatchlistShareImageProps {
  markets: WatchlistMarket[];
}

export function WatchlistShareImage({ markets }: WatchlistShareImageProps) {
  const maxDisplayMarkets = 5;
  const displayMarkets = markets.slice(0, maxDisplayMarkets);
  const remainingMarkets = markets.length - displayMarkets.length;
  const websiteUrl = "omeninsight.com";

  return (
    <div
      className="relative flex flex-col"
      style={{
        width: "1200px",
        background:
          "linear-gradient(135deg, var(--background) 0%, var(--brand-background) 50%, var(--brand-background-deeper) 100%)",
      }}
    >
      {/* Background gradients and grid */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Radial gradients */}
        <div
          className="absolute rounded-full"
          style={{
            left: "20%",
            top: "30%",
            width: "40%",
            paddingBottom: "40%",
            background:
              "radial-gradient(circle, rgba(99, 34, 254, 0.08) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            left: "60%",
            top: "50%",
            width: "35%",
            paddingBottom: "35%",
            background:
              "radial-gradient(circle, rgba(101, 31, 255, 0.06) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            left: "25%",
            top: "25%",
            width: "50%",
            paddingBottom: "50%",
            background:
              "radial-gradient(circle, rgba(135, 120, 174, 0.04) 0%, transparent 70%)",
          }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(99, 34, 254, 0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(99, 34, 254, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative flex flex-col px-[70px] py-[70px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-[50px]">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <img
              src="/logo.svg"
              alt="Logo"
              className="w-20 h-20"
              style={{ flexShrink: 0 }}
            />

            {/* Title and subtitle */}
            <div className="flex flex-col">
              <h1
                className="font-bold leading-none"
                style={{
                  fontSize: "56px",
                  color: "var(--brand-primary)",
                  marginBottom: "8px",
                }}
              >
                OMEN
              </h1>
              <p
                className="font-light leading-none"
                style={{
                  fontSize: "28px",
                  color: "var(--brand-foreground)",
                }}
              >
                Watchlist
              </p>
            </div>

            {/* Market count badge */}
            {/* <div
              className="flex items-center justify-center px-4 rounded-[20px] border-[1.5px]"
              style={{
                height: "40px",
                marginLeft: "50px",
                background:
                  "linear-gradient(135deg, rgba(99, 34, 254, 0.2) 0%, rgba(101, 31, 255, 0.2) 100%)",
                borderColor: "rgba(99, 34, 254, 0.4)",
              }}
            >
              <span
                className="font-semibold"
                style={{
                  fontSize: "20px",
                  color: "#6322FE",
                }}
              >
                {markets.length} market{markets.length !== 1 ? "s" : ""}
              </span>
            </div> */}
          </div>

          {/* Website URL */}
          {/* <div
            className="flex items-center"
            style={{
              fontSize: "32px",
              color: "var(--brand-foreground)",
            }}
          >
            {websiteUrl}
          </div> */}
        </div>

        {/* Market cards */}
        <div className="flex flex-col gap-[18px] mb-[50px]">
          {displayMarkets.map((market, index) => (
            <div
              key={index}
              className="flex items-center rounded-xl border-[1.5px] px-7 py-0"
              style={{
                minHeight: "100px",
                background:
                  "linear-gradient(135deg, rgba(99, 34, 254, 0.15) 0%, rgba(101, 31, 255, 0.1) 100%)",
                borderColor: "rgba(99, 34, 254, 0.3)",
                boxShadow: "0 0 8px rgba(99, 34, 254, 0.3)",
              }}
            >
              {/* Number badge */}
              <div
                className="flex items-center justify-center rounded-full shrink-0"
                style={{
                  width: "44px",
                  height: "44px",
                  background:
                    "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-highlight) 100%)",
                }}
              >
                <span
                  className="font-bold"
                  style={{
                    fontSize: "22px",
                    color: "#ffffff",
                  }}
                >
                  {index + 1}
                </span>
              </div>

              {/* Market question */}
              <div
                className="ml-5 font-normal"
                style={{
                  fontSize: "22px",
                  color: "var(--foreground)",
                  lineHeight: "1.3",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {market.question}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {remainingMarkets > 0 && (
          <div className="flex flex-col items-center pt-6">
            {/* Divider */}
            <div
              className="w-full h-[1.5px] mb-8"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(99, 34, 254, 0.4) 50%, transparent 100%)",
              }}
            />

            {/* Remaining markets text */}
            <p
              className="font-light"
              style={{
                fontSize: "22px",
                color: "var(--brand-foreground)",
              }}
            >
              +{remainingMarkets} more market{remainingMarkets !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
