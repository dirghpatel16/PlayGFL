import { NextResponse } from "next/server";
import { getPublicState } from "@/lib/server/state";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";

export async function GET() {
  if (isSupabaseConfigured()) {
    const [tournamentRows, captainsRows, announcementsRows] = await Promise.all([
      supabaseAdminTable<any[]>("tournaments?select=*&limit=1"),
      supabaseAdminTable<any[]>("captains?select=*"),
      supabaseAdminTable<any[]>("announcements?select=*&order=created_at.desc&limit=20")
    ]);

    const tournament = tournamentRows[0]
      ? {
          id: tournamentRows[0].id,
          name: tournamentRows[0].name,
          game: "BGMI",
          timezone: "Asia/Kolkata",
          launchAtIST: tournamentRows[0].launch_at,
          startsAtIST: tournamentRows[0].starts_at,
          registrationOpen: tournamentRows[0].registration_open,
          prizePoolINR: tournamentRows[0].prize_pool_inr,
          format: tournamentRows[0].format
        }
      : null;

    return NextResponse.json({
      tournament,
      captains: captainsRows.map((c) => ({ id: c.id, name: c.name, tag: c.tag, region: c.region, pursePoints: c.purse_points })),
      announcements: announcementsRows.map((a) => ({ id: a.id, title: a.title, body: a.body, createdAt: a.created_at, priority: a.priority }))
    });
  }

  return NextResponse.json(getPublicState());
}
