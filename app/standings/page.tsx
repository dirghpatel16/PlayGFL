"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJSON } from "@/lib/services/http";

interface Standing {
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  placementPoints: number;
  killPoints: number;
  bonusPoints: number;
  goldenRoundBonus: number;
  totalPoints: number;
}

interface MatchEntry {
  teamId: string;
  placement: number;
  kills: number;
  bonusType: "none" | "back_to_back" | "threepeat";
  totalPoints: number;
}

interface MatchLog {
  matchNumber: number;
  roundType: "normal" | "golden";
  map: string;
  winnerTeamId?: string;
  entries: MatchEntry[];
}

interface MatchPlan {
  matchNumber: number;
  block: number;
  roundType: "normal" | "golden";
  map: string;
}

export default function StandingsPage() {
  const [rows, setRows] = useState<Standing[]>([]);
  const [logs, setLogs] = useState<MatchLog[]>([]);
  const [plan, setPlan] = useState<MatchPlan[]>([]);

  useEffect(() => {
    fetchJSON<{ standings: Standing[]; matchLogs: MatchLog[]; seasonMatchPlan: MatchPlan[] }>("/api/standings")
      .then((d) => {
        setRows(d.standings ?? []);
        setLogs(d.matchLogs ?? []);
        setPlan(d.seasonMatchPlan ?? []);
      })
      .catch(() => null);
  }, []);

  const teamById = useMemo(() => Object.fromEntries(rows.map((r) => [r.teamId, r.teamName])), [rows]);

  return (
    <div className="py-8 space-y-4">
      <h1 className="section-title">PlayGFL Season 2 Standings</h1>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-white/60">
            <tr>
              <th className="p-3">Rank</th>
              <th className="p-3">Team</th>
              <th className="p-3">MP</th>
              <th className="p-3">Placement</th>
              <th className="p-3">Kills</th>
              <th className="p-3">Bonus</th>
              <th className="p-3">Golden Bonus</th>
              <th className="p-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((r, index) => (
              <tr key={r.teamId} className="border-t border-white/10">
                <td className="p-3 font-semibold">#{index + 1}</td>
                <td className="p-3 font-semibold">{r.teamName}</td>
                <td className="p-3">{r.matchesPlayed}</td>
                <td className="p-3">{r.placementPoints}</td>
                <td className="p-3">{r.killPoints}</td>
                <td className="p-3">{r.bonusPoints}</td>
                <td className="p-3">{r.goldenRoundBonus}</td>
                <td className="p-3 text-neon font-bold">{r.totalPoints}</td>
              </tr>
            )) : <tr><td colSpan={8} className="p-3 text-white/60">No standings yet. Results will appear after match entries.</td></tr>}
          </tbody>
        </table>
      </div>

      <section className="card p-4 space-y-3">
        <h2 className="text-lg font-bold">Match-by-Match Log (30 Match Season)</h2>
        <div className="space-y-2">
          {plan.map((m) => {
            const log = logs.find((row) => row.matchNumber === m.matchNumber);
            return (
              <article key={m.matchNumber} className="rounded border border-white/10 p-3 text-xs">
                <p className="font-semibold">Match {m.matchNumber} • Block {m.block} • {m.roundType === "golden" ? "Golden" : "Normal"} • {log?.map ?? m.map}</p>
                {log ? (
                  <>
                    <p className="mt-1 text-white/70">Winner: {teamById[log.winnerTeamId || ""] || "TBD"}</p>
                    <div className="mt-2 grid gap-1 sm:grid-cols-2">
                      {log.entries.map((entry) => (
                        <div key={entry.teamId} className="rounded bg-white/5 px-2 py-1">
                          {teamById[entry.teamId] || entry.teamId} • P{entry.placement} • K{entry.kills} • {entry.bonusType} • {entry.totalPoints} pts
                        </div>
                      ))}
                    </div>
                  </>
                ) : <p className="mt-1 text-white/50">No result entered yet.</p>}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
