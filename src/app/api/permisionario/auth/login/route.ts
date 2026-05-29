import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/admin";
import { verifyPermitHolderPassword } from "@/server/dashboard/passwords";
import {
  createPermitHolderSession,
  PERMIT_HOLDER_SESSION_COOKIE,
} from "@/server/permisionario/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(128),
  next: z.string().optional(),
});

export async function POST(request: Request) {
  const parse = bodySchema.safeParse(
    await request.json().catch(() => ({})),
  );
  if (!parse.success) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { username, password, next } = parse.data;

  const admin = createAdminClient();
  const { data: account, error: accountError } = await admin
    .from("permit_holder_accounts")
    .select("permit_holder_id, password_hash, active, username")
    .eq("username", username)
    .maybeSingle();

  if (accountError) {
    return Response.json({ error: "Error interno" }, { status: 500 });
  }

  // Generic error to avoid username enumeration.
  if (!account) {
    return Response.json(
      { error: "Usuario o contraseña incorrectos" },
      { status: 401 },
    );
  }

  const row = account as {
    permit_holder_id: string;
    password_hash: string;
    active: boolean;
    username: string;
  };

  const passwordOk = await verifyPermitHolderPassword(
    password,
    row.password_hash,
  );
  if (!passwordOk) {
    return Response.json(
      { error: "Usuario o contraseña incorrectos" },
      { status: 401 },
    );
  }

  if (!row.active) {
    return Response.json(
      {
        error:
          "Tu cuenta está deshabilitada. Contactá a la Municipalidad.",
      },
      { status: 403 },
    );
  }

  const { token, maxAgeSeconds } = await createPermitHolderSession({
    permitHolderId: row.permit_holder_id,
    username: row.username,
  });

  const redirectTo = safeNext(next);
  const response = Response.json({ redirectTo });
  response.headers.append(
    "Set-Cookie",
    `${PERMIT_HOLDER_SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
  return response;
}

function safeNext(value?: string) {
  if (
    !value ||
    !value.startsWith("/permisionario") ||
    value.startsWith("/permisionario/login")
  ) {
    return "/permisionario";
  }
  return value;
}
