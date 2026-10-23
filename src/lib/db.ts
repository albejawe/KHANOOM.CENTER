import { createClient, type Client } from "@libsql/client";

let clientInstance: Client | null = null;

export function getDb(): Client {
  if (clientInstance) return clientInstance;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    // If during build phase, create a mock client so module evaluation doesn't fail
    if (process.env.NEXT_PHASE === "phase-production-build" || !process.env.TURSO_DATABASE_URL) {
      console.warn("⚠️ TURSO_DATABASE_URL is not set yet. Make sure to add it in Vercel Environment Variables.");
      return createClient({
        url: "libsql://placeholder-missing-env.turso.io",
      });
    }
    throw new Error("Missing TURSO_DATABASE_URL environment variable");
  }

  clientInstance = createClient({
    url,
    authToken,
  });

  return clientInstance;
}

// Proxy wrapper so existing code `db.execute(...)` works seamlessly without crashing on module import
export const db = new Proxy({} as Client, {
  get(_target, prop) {
    const client = getDb();
    const val = (client as unknown as Record<string, unknown>)[prop as string];
    return typeof val === "function" ? val.bind(client) : val;
  },
});
