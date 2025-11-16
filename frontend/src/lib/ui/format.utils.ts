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

function normalizeTimestamp(value: number | string | Date): number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return value < 1_000_000_000_000 ? value * 1000 : value;
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function formatRelativeTime(
  value: number | string | Date,
  locale: string = getUserLocale()
): string {
  const timestamp = normalizeTimestamp(value);
  if (timestamp === null) return "-";

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  let duration = (timestamp - Date.now()) / 1000;

  const divisions: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
    { amount: 60, unit: "second" },
    { amount: 60, unit: "minute" },
    { amount: 24, unit: "hour" },
    { amount: 7, unit: "day" },
    { amount: 4.34524, unit: "week" },
    { amount: 12, unit: "month" },
    { amount: Infinity, unit: "year" },
  ];

  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return rtf.format(Math.round(duration), "year");
}
