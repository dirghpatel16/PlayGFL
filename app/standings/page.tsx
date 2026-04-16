"use client";

import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/services/http";

interface OverallRow { teamId: string; teamName: string; matchesPlayed: number; wwcd: number; placementPoints: number; killPoints: number; bonusPoints: number; goldenBonusPoints: number; totalPoints: number }
interface LedgerEntry { teamId: string; teamName: string; placement: number; kills: number; bonusType?: string; nominatedPlayerKills?: number; placementPoints: number; killPoints: number; bonusPoints: number; goldenBonusPoints: number; totalPoints: number; runningTotal: number }
interface LedgerMatch { id: string; matchNumber: number; block: number; roundType: "normal" | "golden"; map: string; winnerTeamName: string; entries: LedgerEntry[] }
interface PlanItem { matchNumber: number; block: number; roundType: "normal" | "golden" }

type Tab = "overall" | "history" | "breakdown";

export default function StandingsPage() {
  const [tab, setTab] = useState<Tab>("overall");
  const [overall, setOverall] = useState<OverallRow[]>([]);
  const [ledger, setLedger] = useState<LedgerMatch[]>([]);
  const [plan, setPlan] = useState<PlanItem[]>([]);

  useEffect(() => {
    fetchJSON<{ overall: OverallRow[]; ledger: LedgerMatch[]; plan: PlanItem[] }>("/api/standings")
      .then((d) => {
        setOverall(d.overall ?? []);
        setLedger(d.ledger ?? []);
        setPlan(d.plan ?? []);
      })
      .catch(() => null);
  }, []);

  return (
    <div className="py-8 space-y-6">
      <h1 className="section-title">PlayGFL Season 2 Standings</h1>

      <div className="flex gap-2 flex-wrap">
        <button className={`rounded px-3 py-2 text-sm ${tab === "overall" ? "bg-neon text-black" : "bg-white/10"}`} onClick={() => setTab("overall")}>Overall Standings</button>
        <button className={`rounded px-3 py-2 text-sm ${tab === "history" ? "bg-neon text-black" : "bg-white/10"}`} onClick={() => setTab("history")}>Match History</button>
        <button className={`rounded px-3 py-2 text-sm ${tab === "breakdown" ? "bg-neon text-black" : "bg-white/10"}`} onClick={() => setTab("breakdown")}>Points Breakdown</button>
      </div>

      {tab === "overall" && (
        <section className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-white/60">
              <tr><th className="p-3">Rank</th><th className="p-3">Team</th><th className="p-3">Played</th><th className="p-3">WWCD</th><th className="p-3">Placement</th><th className="p-3">Kills</th><th className="p-3">Bonus</th><th className="p-3">Golden Bonus</th><th className="p-3">Total</th></tr>
            </thead>
            <tbody>
              {overall.map((r, idx) => <tr key={r.teamId} className="border-t border-white/10"><td className="p-3">#{idx + 1}</td><td className="p-3 font-semibold">{r.teamName}</td><td className="p-3">{r.matchesPlayed}</td><td className="p-3">{r.wwcd}</td><td className="p-3">{r.placementPoints}</td><td className="p-3">{r.killPoints}</td><td className="p-3">{r.bonusPoints}</td><td className="p-3">{r.goldenBonusPoints}</td><td className="p-3 text-neon font-bold">{r.totalPoints}</td></tr>)}
            </tbody>
          </table>
        </section>
      )}

      {tab === "history" && (
        <section className="card p-4 space-y-3">
          <h2 className="text-xl font-bold">Match-by-Match Ledger</h2>
          {ledger.length ? ledger.map((m) => (
            <div key={`${m.matchNumber}-${m.id}`} className="border border-white/10 rounded p-3">
              <p className="text-xs text-neon">Match {m.matchNumber} • Block {m.block} • {m.roundType.toUpperCase()} • {m.map}</p>
              <p className="text-sm mt-1">Winner: {m.winnerTeamName}</p>
              <div className="mt-2 space-y-1 text-xs">
                {m.entries.map((e) => <p key={e.teamId}>{e.teamName}: Place {e.placement}, Kills {e.kills}, Bonus {e.bonusType ?? "none"}, Match Total {e.totalPoints}, Running {e.runningTotal}</p>)}
              </div>
            </div>
          )) : <p>No results entered yet.</p>}
        </section>
      )}

      {tab === "breakdown" && (
        <section className="card p-4">
          <h2 className="text-xl font-bold">30-Match Format Plan</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {plan.map((p) => <div key={p.matchNumber} className={`rounded border p-2 text-xs ${p.roundType === "golden" ? "border-amber-400 text-amber-300" : "border-white/15"}`}>Block {p.block} • Match {p.matchNumber} • {p.roundType.toUpperCase()}</div>)}
          </div>
        </section>
      )}
    </div>
  );
}
