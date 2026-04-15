import { NextRequest, NextResponse } from "next/server";

const ADMIN_HEADER = "x-admin-key";

export function getBackendStatus() {
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
  return {
    storageMode: databaseUrl ? "database-configured" : "in-memory",
    databaseConfigured: Boolean(databaseUrl),
    adminKeyRequired: Boolean(process.env.ADMIN_API_KEY)
  } as const;
}

export function requireAdmin(req: NextRequest): NextResponse | null {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return null;

  const provided = req.headers.get(ADMIN_HEADER);
  if (provided !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function parseJSON(req: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function asNonEmptyString(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length ? normalized : null;
}
