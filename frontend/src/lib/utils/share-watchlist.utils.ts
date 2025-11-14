import { toPng } from "html-to-image";

export interface WatchlistMarket {
  question: string;
  slug: string;
}

export async function generateWatchlistShareImage(
  element: HTMLElement
): Promise<string> {
  try {
    const dataUrl = await toPng(element, {
      quality: 1.0,
      pixelRatio: 2,
      cacheBust: true,
      skipFonts: false,
    });
    return dataUrl;
  } catch (error) {
    console.error("Failed to generate image:", error);
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

