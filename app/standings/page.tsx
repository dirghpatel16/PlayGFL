"use client";

import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/services/http";

interface Standing {
  teamId: string;
  teamName: string;
  placementPoints: number;
  killPoints: number;
  bonusPoints: number;
  goldenModifierPoints: number;
  totalPoints: number;
}

export default function StandingsPage() {
  const [rows, setRows] = useState<Standing[]>([]);

  useEffect(() => {
    fetchJSON<{ standings: Standing[] }>("/api/standings").then((d) => setRows(d.standings ?? [])).catch(() => null);
  }, []);

  return (
    <div className="py-8 space-y-4">
      <h1 className="section-title">PlayGFL Season 2 Standings</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-white/60">
            <tr>
              <th className="p-3">Team</th><th className="p-3">Placement</th><th className="p-3">Kills</th><th className="p-3">Bonus</th><th className="p-3">Golden x2</th><th className="p-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((r) => (
              <tr key={r.teamId} className="border-t border-white/10">
                <td className="p-3 font-semibold">{r.teamName}</td><td className="p-3">{r.placementPoints}</td><td className="p-3">{r.killPoints}</td><td className="p-3">{r.bonusPoints}</td><td className="p-3">{r.goldenModifierPoints}</td><td className="p-3 text-neon font-bold">{r.totalPoints}</td>
              </tr>
            )) : <tr><td colSpan={6} className="p-3 text-white/60">No standings yet. Results will appear after first match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
