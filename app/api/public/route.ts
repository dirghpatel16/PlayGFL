import { NextResponse } from "next/server";
import { getPublicState } from "@/lib/server/state";

export async function GET() {
  return NextResponse.json(getPublicState());
}
