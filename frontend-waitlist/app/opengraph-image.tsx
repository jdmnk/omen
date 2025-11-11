import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { TEXTS } from "./texts.const";

// Image metadata
export const alt = TEXTS.og.alt;
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
          background: "#020402",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Advanced Text */}
        <div
          style={{
            fontSize: 52,
            fontFamily: "Roboto Serif",
            fontStyle: "italic",
            fontWeight: 300,
            color: "#BBA6F2",
            textShadow: "0px 0px 40px #BBA6F2",
            lineHeight: 1,
            // marginBottom: 12,
          }}
        >
          {TEXTS.hero.advanced}
        </div>

        {/* Polymarket Analytics */}
        <div
          style={{
            fontSize: 52,
            fontFamily: "Roboto",
            fontWeight: 300,
            color: "white",
            lineHeight: 1,
            marginBottom: 20,
          }}
        >
          {TEXTS.hero.title}
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
              fontSize: 34,
              fontFamily: "Roboto",
              fontWeight: 300,
              color: "white",
              lineHeight: 1.1,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div>{TEXTS.hero.tagline.line1}</div>
            <div>{TEXTS.hero.tagline.line2}</div>
          </div>
        </div>

        {/* OMEN Branding */}
        <div
          style={{
            // position: "absolute",
            // bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 100,
          }}
        >
          <img
            src={logoDataUrl}
            alt={TEXTS.branding.logoAlt}
            width={48}
            height={48}
            style={{
              display: "flex",
            }}
          />
          {/* <div
            style={{
              fontSize: 40,
              fontFamily: "Roboto",
              fontWeight: 700,
              color: "white",
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
