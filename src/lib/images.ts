/**
 * Image helpers for R2 storage variants.
 * Each image uploaded has two variants:
 * - `<image_key>/t` : thumbnail (width up to 480px, ~30-40KB)
 * - `<image_key>/f` : full resolution (width up to 1280px, ~120-180KB)
 */

export function imageUrl(
  key: string,
  variant: "thumb" | "full" = "thumb",
  customBase?: string
): string {
  const base =
    customBase ||
    process.env.NEXT_PUBLIC_IMAGE_BASE_URL ||
    "";
  const cleanBase = base.replace(/\/+$/, "");
  const cleanKey = key.replace(/^\/+/, "");
  const suffix = variant === "thumb" ? "t" : "f";
  return `${cleanBase}/${cleanKey}/${suffix}`;
}

export function isValidImageKey(key: string): boolean {
  if (!key || typeof key !== "string") return false;
  // Must match safe path like "folder/uuid-or-id" and no path traversal
  if (key.includes("..") || key.startsWith("/") || key.startsWith("\\")) {
    return false;
  }
  return /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(key);
}

export function newImageKey(prefix = "products"): string {
  const unique =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
  return `${prefix}/${unique}`;
}
