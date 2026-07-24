/**
 * Returns the canonical public base URL of the site.
 * Used for building absolute links in emails, OG tags and redirects.
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://www.sozlukzzz.tr";
}
