import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { METADATA } from "@/lib/metadata.const";

// Image metadata
export const alt = "Omen - Advanced Polymarket Analytics";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

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
export default async function Image() {
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
        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontFamily: "Roboto",
            fontWeight: 700,
            color: "white",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: "40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 80, fontWeight: 700, color: "#6322FE" }}>
            {"OMEN"}
          </div>
          {/* {METADATA.title} */}
          <div>{"Advanced Polymarket Analytics"}</div>
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 36,
            fontFamily: "Roboto",
            fontWeight: 300,
            color: "#888",
            textAlign: "center",
            lineHeight: 1.4,
            maxWidth: "900px",
            display: "flex",
          }}
        >
          {METADATA.description}
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
          {/* <div
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
          </div> */}
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
