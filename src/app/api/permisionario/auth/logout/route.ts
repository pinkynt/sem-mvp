import { PERMIT_HOLDER_SESSION_COOKIE } from "@/server/permisionario/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const response = Response.json({ redirectTo: "/permisionario/login" });
  response.headers.append(
    "Set-Cookie",
    `${PERMIT_HOLDER_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
  return response;
}
