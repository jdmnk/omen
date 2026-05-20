export function getSiteUrl() {
  return process.env["NEXT_PUBLIC_SITE_URL"] || "http://localhost:3000";
}

export function getSiteHost() {
  return new URL(getSiteUrl()).host;
}
