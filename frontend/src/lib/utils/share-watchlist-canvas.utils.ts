import { getSiteUrl } from "@/lib/app.const";

export interface WatchlistMarket {
  question: string;
  slug: string;
}

// Polyfill for roundRect if not available
function ensureRoundRect() {
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number | number[]
    ) {
      const r = typeof radius === "number" ? radius : radius[0];
      this.moveTo(x + r, y);
      this.lineTo(x + width - r, y);
      this.arcTo(x + width, y, x + width, y + r, r);
      this.lineTo(x + width, y + height - r);
      this.arcTo(x + width, y + height, x + width - r, y + height, r);
      this.lineTo(x + r, y + height);
      this.arcTo(x, y + height, x, y + height - r, r);
      this.lineTo(x, y + r);
      this.arcTo(x, y, x + r, y, r);
      this.closePath();
      return this;
    };
  }
}

// Color scheme from the app
const COLORS = {
  background: {
    dark: "#020402",
    purple: "#110928",
    purpleDark: "#0a0514",
  },
  brand: {
    primary: "#6322FE",
    highlight: "#651fff",
    foreground: "#8778ae",
    stroke: "#382e52",
  },
  text: {
    white: "#ffffff",
    muted: "#888888",
  },
};

async function loadLogo(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load logo"));
    img.src = window.location.origin + "/logo.svg";
  });
}

function drawGradientBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  // Base gradient
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, COLORS.background.dark);
  bgGradient.addColorStop(0.5, COLORS.background.purple);
  bgGradient.addColorStop(1, COLORS.background.purpleDark);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Add radial gradients for depth
  const radialGradients = [
    {
      x: width * 0.2,
      y: height * 0.3,
      radius: width * 0.4,
      color: COLORS.brand.primary,
      alpha: 0.08,
    },
    {
      x: width * 0.8,
      y: height * 0.7,
      radius: width * 0.35,
      color: COLORS.brand.highlight,
      alpha: 0.06,
    },
    {
      x: width * 0.5,
      y: height * 0.5,
      radius: width * 0.5,
      color: COLORS.brand.foreground,
      alpha: 0.04,
    },
  ];

  radialGradients.forEach(({ x, y, radius, color, alpha }) => {
    const radialGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    radialGrad.addColorStop(
      0,
      color +
        Math.round(alpha * 255)
          .toString(16)
          .padStart(2, "0")
    );
    radialGrad.addColorStop(1, "transparent");
    ctx.fillStyle = radialGrad;
    ctx.fillRect(0, 0, width, height);
  });

  // Add subtle grid pattern
  ctx.strokeStyle = COLORS.brand.primary + "0a"; // 4% opacity
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement,
  marketCount: number,
  x: number,
  y: number,
  maxWidth: number
) {
  // Draw logo
  const logoSize = 80;
  ctx.drawImage(logo, x, y, logoSize, logoSize);

  // Draw title
  ctx.font = "700 56px Roboto, sans-serif";
  ctx.fillStyle = COLORS.brand.primary;
  ctx.fillText("OMEN", x + logoSize + 24, y + 42);

  // Draw subtitle
  ctx.font = "300 28px Roboto, sans-serif";
  ctx.fillStyle = COLORS.brand.foreground;
  ctx.fillText("My Watchlist", x + logoSize + 24, y + 72);

  // Draw website URL in top right
  const websiteUrl = getSiteUrl().replace("https://", "");
  ctx.font = "400 20px Roboto, sans-serif";
  ctx.fillStyle = COLORS.brand.foreground;
  ctx.textAlign = "right";
  ctx.fillText(websiteUrl, x + maxWidth, y + 45);
  ctx.textAlign = "left"; // Reset alignment

  // Draw market count badge
  const badgeText = `${marketCount} market${marketCount !== 1 ? "s" : ""}`;
  ctx.font = "600 20px Roboto, sans-serif";
  const badgeWidth = ctx.measureText(badgeText).width + 32;
  const badgeX = x + logoSize + 270;
  const badgeY = y + 20;

  // Badge background with gradient
  const badgeGradient = ctx.createLinearGradient(
    badgeX,
    badgeY,
    badgeX + badgeWidth,
    badgeY + 40
  );
  badgeGradient.addColorStop(0, COLORS.brand.primary + "20");
  badgeGradient.addColorStop(1, COLORS.brand.highlight + "20");
  ctx.fillStyle = badgeGradient;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, 40, 20);
  ctx.fill();

  // Badge border
  ctx.strokeStyle = COLORS.brand.primary + "40";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Badge text
  ctx.fillStyle = COLORS.brand.primary;
  ctx.fillText(badgeText, badgeX + 16, badgeY + 27);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function drawMarketCard(
  ctx: CanvasRenderingContext2D,
  market: WatchlistMarket,
  index: number,
  x: number,
  y: number,
  width: number
) {
  const cardHeight = 100; // Increased from 90
  const cardPadding = 28; // Increased internal padding

  // Card background with gradient
  const cardGradient = ctx.createLinearGradient(
    x,
    y,
    x + width,
    y + cardHeight
  );
  cardGradient.addColorStop(0, COLORS.brand.primary + "15");
  cardGradient.addColorStop(1, COLORS.brand.highlight + "10");
  ctx.fillStyle = cardGradient;
  ctx.beginPath();
  ctx.roundRect(x, y, width, cardHeight, 12);
  ctx.fill();

  // Card border with glow effect
  ctx.shadowColor = COLORS.brand.primary + "30";
  ctx.shadowBlur = 8;
  ctx.strokeStyle = COLORS.brand.primary + "30";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Number badge
  const badgeSize = 44;
  const badgeRadius = badgeSize / 2;
  const badgeX = x + cardPadding;
  const badgeY = y + cardHeight / 2;

  // Badge gradient
  const numberGradient = ctx.createLinearGradient(
    badgeX - badgeRadius,
    badgeY - badgeRadius,
    badgeX + badgeRadius,
    badgeY + badgeRadius
  );
  numberGradient.addColorStop(0, COLORS.brand.primary);
  numberGradient.addColorStop(1, COLORS.brand.highlight);
  ctx.fillStyle = numberGradient;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Badge number
  ctx.font = "700 22px Roboto, sans-serif";
  ctx.fillStyle = COLORS.text.white;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(index + 1), badgeX, badgeY);

  // Market question
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "400 22px Roboto, sans-serif";
  ctx.fillStyle = COLORS.text.white;

  const textX = x + cardPadding + badgeSize + 20;
  const textMaxWidth = width - cardPadding * 2 - badgeSize - 20;
  const lines = wrapText(ctx, market.question, textMaxWidth);
  const maxLines = 2;
  const lineHeight = 28;
  const startY =
    y + (cardHeight - Math.min(lines.length, maxLines) * lineHeight) / 2;

  lines.slice(0, maxLines).forEach((line, lineIndex) => {
    let displayLine = line;
    if (lineIndex === maxLines - 1 && lines.length > maxLines) {
      displayLine = line.substring(0, line.length - 3) + "...";
    }
    ctx.fillText(displayLine, textX, startY + lineIndex * lineHeight);
  });
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  totalMarkets: number,
  displayedMarkets: number,
  x: number,
  y: number,
  width: number
) {
  // Divider line with gradient
  const dividerGradient = ctx.createLinearGradient(x, y, x + width, y);
  dividerGradient.addColorStop(0, "transparent");
  dividerGradient.addColorStop(0.5, COLORS.brand.primary + "40");
  dividerGradient.addColorStop(1, "transparent");
  ctx.strokeStyle = dividerGradient;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.stroke();

  // Center text: remaining markets
  if (totalMarkets > displayedMarkets) {
    ctx.font = "300 22px Roboto, sans-serif";
    ctx.fillStyle = COLORS.brand.foreground;
    ctx.textAlign = "center";
    ctx.fillText(
      `+${totalMarkets - displayedMarkets} more market${
        totalMarkets - displayedMarkets !== 1 ? "s" : ""
      }`,
      x + width / 2,
      y + 32
    );
  }
}

export async function generateWatchlistShareImageCanvas(
  markets: WatchlistMarket[]
): Promise<string> {
  // Ensure roundRect polyfill is available
  ensureRoundRect();

  const canvas = document.createElement("canvas");
  const width = 1200;
  const height = 675; // Twitter optimized (16:9)
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Enable better text rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  try {
    // Load logo
    const logo = await loadLogo();

    // Draw background
    drawGradientBackground(ctx, width, height);

    // Define layout
    const padding = 70; // Increased padding
    const contentWidth = width - padding * 2;

    // Draw header
    drawHeader(ctx, logo, markets.length, padding, padding, contentWidth);

    // Draw markets
    const marketStartY = padding + 130; // More space after header
    const maxDisplayMarkets = 5; // Show max 5 markets for better readability
    const displayMarkets = markets.slice(0, maxDisplayMarkets);
    const cardHeight = 100;
    const marketCardGap = 18; // Increased gap between cards

    displayMarkets.forEach((market, index) => {
      const cardY = marketStartY + index * (cardHeight + marketCardGap);
      drawMarketCard(ctx, market, index, padding, cardY, contentWidth);
    });

    // Draw footer
    const footerY = height - padding - 50;
    drawFooter(
      ctx,
      markets.length,
      displayMarkets.length,
      padding,
      footerY,
      contentWidth
    );

    // Convert to data URL
    return canvas.toDataURL("image/png", 1.0);
  } catch (error) {
    console.error("Failed to generate canvas image:", error);
    throw error;
  }
}

export async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch (error) {
    console.error("Failed to copy image to clipboard:", error);
    return false;
  }
}

export async function downloadWatchlistImage(
  dataUrl: string,
  filename: string = "omen-watchlist.png"
) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function shareWatchlistImage(dataUrl: string) {
  try {
    // Try native share API first
    if (navigator.share && navigator.canShare) {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "omen-watchlist.png", {
        type: "image/png",
      });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "My Omen Watchlist",
          text: "Check out my watchlist on Omen! 📊",
          files: [file],
        });
        return true;
      }
    }
  } catch (error) {
    console.error("Share failed, falling back to download:", error);
  }

  // Fallback to download
  await downloadWatchlistImage(dataUrl);
  return false;
}
