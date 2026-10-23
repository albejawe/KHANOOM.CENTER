import { cookies } from "next/headers";
import { verifySessionToken, type SessionPayload } from "./auth";

export const COOKIE_NAME = "kc_admin_session";

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized: Admin login required");
  }
  return session;
}
