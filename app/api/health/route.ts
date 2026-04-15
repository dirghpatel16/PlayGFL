import { NextResponse } from "next/server";
import { getBackendStatus } from "@/lib/server/auth";
import { isSupabaseConfigured } from "@/lib/supabase/rest";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "gfl-league",
    timestamp: new Date().toISOString(),
    backend: {
      ...getBackendStatus(),
      supabaseConfigured: isSupabaseConfigured()
    }
  });
}
