import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Image metadata
export const alt = "Omen | Advanced Polymarket Analytics";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image() {
  // Font loading
  const robotoSerifLightItalic = await readFile(
    join(process.cwd(), "font/Roboto_Serif/static/RobotoSerif-LightItalic.ttf")
  );

  const robotoLight = await readFile(
    join(process.cwd(), "font/Roboto/Roboto/static/Roboto-Light.ttf")
  );

  const robotoBold = await readFile(
    join(process.cwd(), "font/Roboto/Roboto/static/Roboto-Bold.ttf")
  );

  // Logo loading
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
          fontSize: 128,
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
        {/* Advanced Text */}
        <div
          style={{
            fontSize: 80,
            fontFamily: "Roboto Serif",
            fontStyle: "italic",
            fontWeight: 300,
            color: "#BBA6F2",
            textShadow: "0px 0px 40px #BBA6F2",
            lineHeight: 1,
            marginBottom: 20,
          }}
        >
          Advanced
        </div>

        {/* Polymarket Analytics */}
        <div
          style={{
            fontSize: 80,
            fontFamily: "Roboto",
            fontWeight: 300,
            color: "white",
            lineHeight: 1,
            marginBottom: 40,
          }}
        >
          Polymarket Analytics
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 20,
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontFamily: "Roboto",
              fontWeight: 300,
              color: "white",
              lineHeight: 1.4,
              textAlign: "center",
            }}
          >
            Understand markets and holders in seconds.
          </div>
          <div
            style={{
              fontSize: 32,
              fontFamily: "Roboto",
              fontWeight: 300,
              color: "white",
              lineHeight: 1.4,
              textAlign: "center",
            }}
          >
            Trade with confidence.
          </div>
        </div>

        {/* OMEN Branding */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <img
            src={logoDataUrl}
            alt="OMEN Logo"
            width={48}
            height={48}
            style={{
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 40,
              fontFamily: "Roboto",
              fontWeight: 700,
              color: "white",
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
        {
          name: "Roboto Serif",
          data: robotoSerifLightItalic,
          style: "italic",
          weight: 300,
        },
        {
          name: "Roboto",
          data: robotoLight,
          style: "normal",
          weight: 300,
        },
        {
          name: "Roboto",
          data: robotoBold,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
