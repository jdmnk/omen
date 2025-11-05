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

export function formatCompactCurrency(
  value: number | string,
  locale: string = getUserLocale()
): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "$0";

  if (n >= 1000000) {
    return `$${(n / 1000000).toFixed(2)}m`;
  }
  if (n >= 1000) {
    return `$${(n / 1000).toFixed(2)}k`;
  }
  return formatCurrency(n, locale);
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

export function autoFormatDuration(ms: number, locale = getUserLocale()) {
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
