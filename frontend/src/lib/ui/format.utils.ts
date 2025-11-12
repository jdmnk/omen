function getUserLocale(): string {
  if (Array.isArray(navigator.languages) && navigator.languages.length) {
    return navigator.languages[0];
  }
  return navigator.language || "en";
}

export function formatNumber(
  value: number | string,
  maximumFractionDigits = 2
) {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString(undefined, { maximumFractionDigits });
}

export function formatCurrency(
  value: number | string,
  maximumFractionDigits = 2,
  locale: string = getUserLocale()
) {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "$0";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: maximumFractionDigits,
  }).format(n);
}

export function formatCompactNumber(
  value: number,
  maxDecimals = 2,
  locale: string = getUserLocale()
): string {
  return Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: maxDecimals,
  }).format(value);
}

export function formatCompactCurrency(
  value: number | string,
  maxDecimals = 2,
  locale: string = getUserLocale()
): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "$0";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    notation: "compact",
    compactDisplay: "short",
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(n);
}

function formatDuration(
  value: number,
  unit: Intl.NumberFormatOptions["unit"],
  unitDisplay: "long" | "short" | "narrow" = "long",
  locale: string = getUserLocale()
) {
  const nf = new Intl.NumberFormat(locale, {
    style: "unit",
    unit,
    unitDisplay,
  });
  return nf.format(value);
}

export function autoFormatDuration(ms: number) {
  const seconds = ms / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const months = days / 30;

  if (months >= 1) return formatDuration(Math.floor(months), "month");
  if (days >= 1) return formatDuration(Math.floor(days), "day");
  if (hours >= 1) return formatDuration(Math.floor(hours), "hour");
  if (minutes >= 1) return formatDuration(Math.floor(minutes), "minute");
  return formatDuration(Math.floor(seconds), "second");
}

export function formatAddress(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * Decode a hex string to UTF-8 text.
 * Handles hex strings with or without 0x prefix.
 * Removes null bytes and trims whitespace.
 */
export function decodeHexToText(hex: string): string {
  try {
    // Remove 0x prefix if present
    const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;

    // Convert hex pairs to bytes
    const bytes = new Uint8Array(
      cleanHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );

    // Decode as UTF-8
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);

    // Remove null bytes and trim
    return text.replace(/\0/g, "").trim();
  } catch (error) {
    // If decoding fails, return the original hex string
    return hex;
  }
}
