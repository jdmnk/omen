export const formatNumber = (
  value: number | string,
  maximumFractionDigits = 2
) => {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString(undefined, { maximumFractionDigits });
};

export const formatCurrency = (value: number | string) => {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
};
