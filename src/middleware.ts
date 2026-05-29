import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { updateSession } from "@/utils/supabase/middleware";

const PERMIT_HOLDER_COOKIE = "sem_ph_session";

// Pages under /permisionario that do NOT require a session
const PUBLIC_PH_PATHS = new Set(["/permisionario/login"]);

// API paths under /api/permisionario that do NOT require a session
const PUBLIC_PH_API_PATHS = new Set([
  "/api/permisionario/auth/login",
  "/api/permisionario/auth/logout",
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dashboard branch — delegate to existing Supabase session guard
  if (pathname.startsWith("/dashboard")) {
    return updateSession(request);
  }

  const isPermisionarioPage =
    pathname.startsWith("/permisionario") && !PUBLIC_PH_PATHS.has(pathname);

  const isPermisionarioApi = pathname.startsWith("/api/permisionario") &&
    !PUBLIC_PH_API_PATHS.has(pathname);

  // Gate all /api/parking/** EXCEPT:
  // - public GET on /api/parking/payment-tickets/[externalId] (MercadoPago webhook lookup)
  const isPermitHolderApi =
    pathname.startsWith("/api/parking") &&
    !(
      request.method === "GET" &&
      pathname.startsWith("/api/parking/payment-tickets/")
    );

  if (isPermisionarioPage || isPermisionarioApi || isPermitHolderApi) {
    const token = request.cookies.get(PERMIT_HOLDER_COOKIE)?.value;
    const valid = token ? await verifyEdge(token) : false;

    if (!valid) {
      if (isPermitHolderApi || isPermisionarioApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const url = request.nextUrl.clone();
      url.pathname = "/permisionario/login";
      url.search = "";
      url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

async function verifyEdge(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(
      process.env.PERMIT_HOLDER_SESSION_SECRET,
    );
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/permisionario/:path*",
    "/api/parking/:path*",
    "/api/permisionario/:path*",
  ],
};
