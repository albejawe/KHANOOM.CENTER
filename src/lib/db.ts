import { createClient } from "@libsql/client";

function getTursoClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("Missing TURSO_DATABASE_URL environment variable");
  }

  return createClient({
    url,
    authToken,
  });
}

// Global cached client instance for serverless / next.js re-use
const globalForDb = globalThis as unknown as {
  tursoDb: ReturnType<typeof createClient> | undefined;
};

export const db = globalForDb.tursoDb ?? getTursoClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.tursoDb = db;
}
