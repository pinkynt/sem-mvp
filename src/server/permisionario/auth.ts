import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const PERMIT_HOLDER_SESSION_COOKIE = "sem_ph_session";
const TTL_SECONDS = 60 * 60 * 8; // 8 hours, fixed — no sliding refresh

export type PermitHolderSession = {
  permitHolderId: string;
  username: string;
  iat: number;
  exp: number;
};

export type PermitHolderJwtClaims = JWTPayload & {
  phId: string;
  username: string;
};

function getSecret(): Uint8Array {
  const raw = process.env.PERMIT_HOLDER_SESSION_SECRET;
  if (!raw) throw new Error("Missing PERMIT_HOLDER_SESSION_SECRET");
  return new TextEncoder().encode(raw);
}

export async function createPermitHolderSession(input: {
  permitHolderId: string;
  username: string;
}): Promise<{ token: string; maxAgeSeconds: number }> {
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({
    phId: input.permitHolderId,
    username: input.username,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + TTL_SECONDS)
    .sign(getSecret());

  return { token, maxAgeSeconds: TTL_SECONDS };
}

export async function readPermitHolderSession(): Promise<PermitHolderSession | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(PERMIT_HOLDER_SESSION_COOKIE);
    if (!cookie?.value) return null;

    const { payload } = await jwtVerify<PermitHolderJwtClaims>(
      cookie.value,
      getSecret(),
    );

    if (!payload.phId || !payload.username) return null;

    return {
      permitHolderId: payload.phId,
      username: payload.username,
      iat: payload.iat ?? 0,
      exp: payload.exp ?? 0,
    };
  } catch {
    return null;
  }
}

export async function requirePermitHolderSession(): Promise<PermitHolderSession> {
  const session = await readPermitHolderSession();
  if (!session) {
    redirect("/permisionario/login");
  }
  return session;
}

export async function clearPermitHolderSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PERMIT_HOLDER_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
