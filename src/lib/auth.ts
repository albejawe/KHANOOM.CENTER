import { SignJWT, jwtVerify } from "jose";

export interface SessionPayload {
  username: string;
}

export function checkCredentials(
  inputUser: string,
  inputPass: string,
  expectedUser = process.env.ADMIN_USERNAME || "ALBEJAWE",
  expectedPass = process.env.ADMIN_PASSWORD || "10468416"
): boolean {
  if (!inputUser || !inputPass) return false;
  return (
    inputUser.trim().toLowerCase() === expectedUser.trim().toLowerCase() &&
    inputPass === expectedPass
  );
}

export async function createSessionToken(
  payload: SessionPayload,
  secret = process.env.AUTH_SECRET || "default-dev-secret-change-in-prod"
): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);
  return new SignJWT({ username: payload.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey);
}

export async function verifySessionToken(
  token: string,
  secret = process.env.AUTH_SECRET || "default-dev-secret-change-in-prod"
): Promise<SessionPayload | null> {
  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    if (typeof payload.username === "string") {
      return { username: payload.username };
    }
    return null;
  } catch {
    return null;
  }
}
