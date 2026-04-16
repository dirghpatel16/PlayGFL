"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJSON } from "@/lib/services/http";

type TabKey = "overall" | "history" | "breakdown";

interface Standing {
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  chickenDinners: number;
  placementPoints: number;
  killPoints: number;
  bonusPoints: number;
  goldenRoundBonus: number;
  totalPoints: number;
}

interface MatchLedgerEntry {
  teamId: string;
  teamName: string;
  placement: number;
  killPoints: number;
  bonusPoints: number;
  goldenRoundBonus: number;
  totalPoints: number;
  runningTotal: number;
}

interface MatchLedgerRow {
  matchNumber: number;
  block: number;
  cycle: 1 | 2;
  roundType: "normal" | "golden";
  map: string;
  winnerTeamName?: string;
  entries: MatchLedgerEntry[];
}

interface BreakdownRow {
  teamId: string;
  teamName: string;
  normalMatches: number;
  goldenMatches: number;
  normalPoints: number;
  goldenPoints: number;
  averagePerMatch: number;
}

interface MatchPlan {
  matchNumber: number;
  block: number;
  roundType: "normal" | "golden";
  map: string;
}

export default function StandingsPage() {
  const [tab, setTab] = useState<TabKey>("overall");
  const [rows, setRows] = useState<Standing[]>([]);
  const [ledger, setLedger] = useState<MatchLedgerRow[]>([]);
  const [plan, setPlan] = useState<MatchPlan[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownRow[]>([]);

  useEffect(() => {
    fetchJSON<{
      standings: Standing[];
      matchLedger: MatchLedgerRow[];
      pointsBreakdown: BreakdownRow[];
      seasonMatchPlan: MatchPlan[];
    }>("/api/standings")
      .then((d) => {
        setRows(d.standings ?? []);
        setLedger(d.matchLedger ?? []);
        setBreakdown(d.pointsBreakdown ?? []);
        setPlan(d.seasonMatchPlan ?? []);
      })
      .catch(() => null);
  }, []);

  const ledgerByMatch = useMemo(() => Object.fromEntries(ledger.map((item) => [item.matchNumber, item])), [ledger]);

  return (
    <div className="py-8 space-y-4">
      <h1 className="section-title">GFL Season 2 Official Standings</h1>
      <p className="text-sm text-white/70">Premium leaderboard + full season spreadsheet-style ledger for all 30 matches.</p>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setTab("overall")} className={`rounded-lg px-3 py-2 text-sm ${tab === "overall" ? "bg-neon/20 text-neon" : "bg-white/5 text-white/70"}`}>Overall Standings</button>
        <button onClick={() => setTab("history")} className={`rounded-lg px-3 py-2 text-sm ${tab === "history" ? "bg-neon/20 text-neon" : "bg-white/5 text-white/70"}`}>Match History</button>
        <button onClick={() => setTab("breakdown")} className={`rounded-lg px-3 py-2 text-sm ${tab === "breakdown" ? "bg-neon/20 text-neon" : "bg-white/5 text-white/70"}`}>Points Breakdown</button>
      </div>

      {tab === "overall" && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-white/60">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Team Name</th>
                <th className="p-3">MP</th>
                <th className="p-3">WWCD</th>
                <th className="p-3">Placement</th>
                <th className="p-3">Kill Points</th>
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
                  <td className="p-3">{r.chickenDinners}</td>
                  <td className="p-3">{r.placementPoints}</td>
                  <td className="p-3">{r.killPoints}</td>
                  <td className="p-3">{r.bonusPoints}</td>
                  <td className="p-3">{r.goldenRoundBonus}</td>
                  <td className="p-3 text-neon font-bold">{r.totalPoints}</td>
                </tr>
              )) : <tr><td colSpan={9} className="p-3 text-white/60">No standings yet. Results will appear after match entries.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "history" && (
        <section className="card p-4 space-y-3">
          <h2 className="text-lg font-bold">Match-by-Match Ledger (Spreadsheet Mode)</h2>
          <div className="space-y-3">
            {plan.map((scheduled) => {
              const row = ledgerByMatch[scheduled.matchNumber];
              return (
                <article key={scheduled.matchNumber} className="rounded border border-white/10 p-3 text-xs">
                  <p className="font-semibold">Match {scheduled.matchNumber} • Block {scheduled.block} • {scheduled.roundType === "golden" ? "Golden" : "Normal"} • {row?.map ?? scheduled.map}</p>
                  {row ? (
                    <>
                      <p className="mt-1 text-white/70">Winner: {row.winnerTeamName ?? "TBD"}</p>
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full min-w-[680px]">
                          <thead className="text-left text-white/60">
                            <tr>
                              <th className="p-2">Team</th>
                              <th className="p-2">Placement</th>
                              <th className="p-2">Kill Pts</th>
                              <th className="p-2">Bonus</th>
                              <th className="p-2">Golden Mod</th>
                              <th className="p-2">Match Total</th>
                              <th className="p-2">Running Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.entries.map((entry) => (
                              <tr key={entry.teamId} className="border-t border-white/10">
                                <td className="p-2">{entry.teamName}</td>
                                <td className="p-2">P{entry.placement}</td>
                                <td className="p-2">{entry.killPoints}</td>
                                <td className="p-2">{entry.bonusPoints}</td>
                                <td className="p-2">{entry.goldenRoundBonus}</td>
                                <td className="p-2 font-semibold">{entry.totalPoints}</td>
                                <td className="p-2 text-neon font-semibold">{entry.runningTotal}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : <p className="mt-1 text-white/50">No official result entered yet.</p>}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {tab === "breakdown" && (
        <section className="card p-4 overflow-x-auto">
          <h2 className="text-lg font-bold">Points Breakdown by Round Type</h2>
          <table className="w-full min-w-[640px] mt-3 text-sm">
            <thead className="text-left text-white/60">
              <tr>
                <th className="p-2">Team</th>
                <th className="p-2">Normal Matches</th>
                <th className="p-2">Golden Matches</th>
                <th className="p-2">Normal Points</th>
                <th className="p-2">Golden Points</th>
                <th className="p-2">Avg / Match</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.length ? breakdown.map((row) => (
                <tr key={row.teamId} className="border-t border-white/10">
                  <td className="p-2 font-semibold">{row.teamName}</td>
                  <td className="p-2">{row.normalMatches}</td>
                  <td className="p-2">{row.goldenMatches}</td>
                  <td className="p-2">{row.normalPoints}</td>
                  <td className="p-2">{row.goldenPoints}</td>
                  <td className="p-2 text-neon">{row.averagePerMatch}</td>
                </tr>
              )) : <tr><td colSpan={6} className="p-3 text-white/60">No points breakdown yet.</td></tr>}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
