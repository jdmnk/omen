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
  locale: string = getUserLocale()
) {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "$0";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatCompactNumber(
  value: number,
  locale: string = getUserLocale()
): string {
  return Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
  }).format(value);
}

function formatDuration(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale = getUserLocale()
) {
  console.log(value);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  // Example: parts = [{ type: "integer", value: "12" }, { type: "literal", value: " " }, { type: "unit", value: "days" }]
  const parts = rtf.formatToParts(value, unit);
  return parts
    .map((p) => p.value)
    .join("")
    .replace(/^in\s+|ago\s*$/g, "")
    .trim();
}

export function autoFormatDuration(ms: number, locale = getUserLocale()) {
  const seconds = ms / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const months = days / 30;

  if (months >= 1) return formatDuration(Math.floor(months), "month", locale);
  if (days >= 1) return formatDuration(Math.floor(days), "day", locale);
  if (hours >= 1) return formatDuration(Math.floor(hours), "hour", locale);
  if (minutes >= 1)
    return formatDuration(Math.floor(minutes), "minute", locale);
  return formatDuration(Math.floor(seconds), "second", locale);
}
