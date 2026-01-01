import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Market } from "@/lib/models/api.models";

// Image metadata
export const alt = "Market preview";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

async function fetchMarket(slug: string): Promise<Market | null> {
  const baseUrl = process.env["NEXT_PUBLIC_API_URL"];
  if (!baseUrl) return null;

  try {
    const response = await fetch(
      `${baseUrl}/markets/search-slug?slug=${encodeURIComponent(slug)}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Market;
  } catch {
    return null;
  }
}

async function loadLocalFont(weight: number) {
  try {
    const fontPath = join(
      process.cwd(),
      "src/font/Roboto/Roboto/static",
      weight === 300 ? "Roboto-Light.ttf" : "Roboto-Bold.ttf"
    );
    return await readFile(fontPath);
  } catch (error) {
    console.error(`[OG Image] Failed to load font weight ${weight}:`, error);
    return null;
  }
}

// Image generation
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const market = await fetchMarket(slug);

  // Load fonts
  const robotoLight = await loadLocalFont(300);
  const robotoBold = await loadLocalFont(700);

  // Load logo
  const logoSvg = await readFile(
    join(process.cwd(), "public/logo.svg"),
    "utf-8"
  );
  const logoDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    logoSvg
  )}`;

  // Parse market data
  const question = market?.question || `Market: ${slug}`;
  const outcomes = market?.outcomes?.split(",") || ["YES", "NO"];
  const outcomePrices = market?.outcomePrices?.split(",") || ["0.50", "0.50"];
  const yesPrice = outcomePrices[0] ? Number(outcomePrices[0]) * 100 : 50;
  const noPrice = outcomePrices[1] ? Number(outcomePrices[1]) * 100 : 50;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#020402",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        {/* Market Question */}
        <div
          style={{
            fontSize: question.length > 60 ? 48 : 56,
            fontFamily: "Roboto",
            fontWeight: 700,
            color: "white",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: "60px",
            maxWidth: "1000px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            wordBreak: "break-word",
          }}
        >
          {question}
        </div>

        {/* Odds Display */}
        <div
          style={{
            display: "flex",
            gap: "60px",
            alignItems: "center",
          }}
        >
          {/* YES Outcome */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontFamily: "Roboto",
                fontWeight: 300,
                color: "#22c55e",
                textTransform: "uppercase",
                display: "flex",
              }}
            >
              {outcomes[0] || "YES"}
            </div>
            <div
              style={{
                fontSize: 72,
                fontFamily: "Roboto",
                fontWeight: 700,
                color: "#22c55e",
                display: "flex",
              }}
            >
              {yesPrice.toFixed(1)}%
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              width: "2px",
              height: "120px",
              background: "#333",
              display: "flex",
            }}
          />

          {/* NO Outcome */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontFamily: "Roboto",
                fontWeight: 300,
                color: "#ef4444",
                textTransform: "uppercase",
                display: "flex",
              }}
            >
              {outcomes[1] || "NO"}
            </div>
            <div
              style={{
                fontSize: 72,
                fontFamily: "Roboto",
                fontWeight: 700,
                color: "#ef4444",
                display: "flex",
              }}
            >
              {noPrice.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Branding */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <img
            src={logoDataUrl}
            alt="Logo"
            width={48}
            height={48}
            style={{
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 32,
              fontFamily: "Roboto",
              fontWeight: 700,
              color: "white",
              letterSpacing: "0.1em",
              display: "flex",
            }}
          >
            OMEN
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        ...(robotoLight
          ? [
              {
                name: "Roboto",
                data: robotoLight,
                style: "normal" as const,
                weight: 300 as const,
              },
            ]
          : []),
        ...(robotoBold
          ? [
              {
                name: "Roboto",
                data: robotoBold,
                style: "normal" as const,
                weight: 700 as const,
              },
            ]
          : []),
      ],
    }
  );
}
