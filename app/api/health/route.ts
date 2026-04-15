import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "gfl-league",
    timestamp: new Date().toISOString()
  });
}
