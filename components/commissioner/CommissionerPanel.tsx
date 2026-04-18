"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { fetchJSON } from "@/lib/services/http";
import { seasonMatchPlan } from "@/lib/config/matchFormat";

interface Team { id: string; name: string }
interface Captain { id: string; name: string; tag: string; region: string; user_id?: string | null }
interface Player { id: string; name: string; role: string; region: string; style: string }
interface SubmissionHistoryEvent { id: string; status: string; note: string; at: string }
interface Submission {
  user_id: string;
  username: string;
  email?: string;
  payer_name?: string;
  utr?: string;
  screenshot_name?: string;
  screenshot_data_url?: string;
  status: string;
  updated_at?: string;
  submitted_at?: string;
  bgmi_name?: string;
  bgmi_id?: string;
  history?: SubmissionHistoryEvent[];
}
type Role = "owner" | "staff";

// Score Grid Types
interface MatchScore { teamId: string; points: number }
interface BlockScores { [matchNumber: number]: MatchScore[] }

export function CommissionerPanel() {
  const [enabled, setEnabled] = useState(false);
  const [role, setRole] = useState<Role>("staff");
  const [passcode, setPasscode] = useState("");
  const [message, setMessage] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [captains, setCaptains] = useState<Captain[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [search, setSearch] = useState("");

  // Block scoring state
  const [activeBlock, setActiveBlock] = useState(1);
  const [blockScores, setBlockScores] = useState<Record<string, Record<number, number>>>({}); // teamId -> { roundIndex: score }

  const isOwner = enabled && role === "owner";

  const loadCore = () => {
    fetchJSON<{ enabled: boolean; role: Role | null }>("/api/commissioner/session")
      .then((d) => {
        setEnabled(d.enabled);
        if (d.role) setRole(d.role);
      })
      .catch(() => setEnabled(false));
    fetchJSON<{ teams: Team[] }>("/api/teams").then((d) => setTeams(d.teams ?? [])).catch(() => null);
    fetchJSON<{ captains: Captain[] }>("/api/captains").then((d) => setCaptains(d.captains ?? [])).catch(() => null);
    fetchJSON<{ players: Player[] }>("/api/players").then((d) => setPlayers(d.players ?? [])).catch(() => null);
  };

  const loadPayments = () => {
    if (!enabled) return;
    fetchJSON<{ submissions: Submission[] }>(`/api/payment/submissions?q=${encodeURIComponent(search)}`)
      .then((d) => setSubmissions(d.submissions ?? []))
      .catch(() => setSubmissions([]));
  };

  useEffect(() => {
    loadCore();
  }, []);

  useEffect(() => {
    loadPayments();
  }, [enabled, search]);

  const unlock = async (e: FormEvent) => {
    e.preventDefault();
    await fetchJSON("/api/commissioner/session", { method: "POST", body: JSON.stringify({ passcode, role }) });
    setPasscode("");
    setEnabled(true);
    setMessage(`Commissioner Mode Active — ${role === "owner" ? "Owner" : "Staff"}`);
    loadCore();
    loadPayments();
  };

  const lock = async () => {
    await fetchJSON("/api/commissioner/session", { method: "DELETE" });
    setEnabled(false);
    setMessage("Commissioner mode exited.");
  };

  const run = async (url: string, method = "POST", body?: Record<string, unknown>) => {
    await fetchJSON(url, { method, body: body ? JSON.stringify(body) : undefined });
    setMessage("Action saved.");
    loadCore();
    loadPayments();
  };

  const updateBlockScore = (teamId: string, roundIndex: number, score: number) => {
    setBlockScores(prev => ({
      ...prev,
      [teamId]: { ...(prev[teamId] || {}), [roundIndex]: score }
    }));
  };

  const submitBlockScores = async (e: FormEvent) => {
    e.preventDefault();
    const blockMatches = seasonMatchPlan.filter(m => m.block === activeBlock);
    
    // Save each round in the block
    for (let i = 0; i < blockMatches.length; i++) {
      const match = blockMatches[i];
      const entries = teams.map(team => ({
        teamId: team.id,
        points: blockScores[team.id]?.[i] ?? 0
      }));

      await fetchJSON("/api/results", {
        method: "POST",
        body: JSON.stringify({
          matchNumber: match.matchNumber,
          roundType: match.roundType,
          map: match.map,
          entries
        })
      });
    }
    
    setMessage(`Block ${activeBlock} scores saved! Standings recalculated.`);
  };

  const confirmPayment = async (userId: string) => {
    await fetchJSON("/api/payment", { method: "PATCH", body: JSON.stringify({ userId, action: "confirm" }) });
    setMessage("Payment confirmed.");
  };

  const rejectPayment = async (userId: string) => {
    await fetchJSON("/api/payment", { method: "PATCH", body: JSON.stringify({ userId, action: "reject" }) });
    setMessage("Payment rejected.");
  };

  const ownerCapabilities = ["Verify/reject payments", "Add/remove captains", "Rename teams", "Manage auction pool", "Edit results & standings", "Owner reset controls"];
  const staffCapabilities = ["View payments", "Add/remove players", "Run auction session", "Input results"];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">Commissioner Mode</h2>
          <p className="text-sm text-white/70">Hidden by default for public viewers. Unlock with passcode.</p>
        </div>
        {enabled && <span className="rounded-full bg-neon/15 text-neon px-3 py-1 text-xs uppercase">Commissioner Mode Active — {role === "owner" ? "Owner" : "Staff"}</span>}
      </div>

      {!enabled ? (
        <form onSubmit={unlock} className="grid gap-2 sm:grid-cols-3">
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="rounded-lg bg-white/5 px-3 py-2"><option value="staff">Staff</option><option value="owner">Owner</option></select>
          <input required type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} className="rounded-lg bg-white/5 px-3 py-2" placeholder="Enter passcode" />
          <button className="cta-primary">Unlock Commissioner Mode</button>
        </form>
      ) : <button className="cta-ghost" onClick={lock}>Exit Commissioner Mode</button>}

      {message && <p className="text-sm text-neon">{message}</p>}

      {enabled && <div className="text-xs text-white/75">{isOwner ? ownerCapabilities.join(" • ") : staffCapabilities.join(" • ")}</div>}

      {enabled && <div className="grid gap-4 lg:grid-cols-2">
        <form className="space-y-2 border border-white/10 p-3" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); run("/api/players", "POST", Object.fromEntries(f.entries())); e.currentTarget.reset(); }}>
          <p className="text-sm font-semibold">Players</p>
          <input required name="name" className="w-full rounded bg-white/5 p-2" placeholder="Player name" />
          <select required name="role" className="w-full rounded bg-white/5 p-2"><option>Assaulter</option><option>Support</option><option>IGL</option><option>Sniper</option><option>Flexible</option></select>
          <button className="cta-primary w-full">Add Player</button>
          <div className="space-y-1 max-h-40 overflow-auto">
            {players.map((p) => (
              <div key={p.id} className="flex justify-between items-center text-xs border-b border-white/5 pb-1">
                <span>{p.name}</span>
                <div className="flex gap-2">
                  {captains.length < 3 && (
                    <button type="button" className="text-neon" onClick={() => {
                      const tag = prompt(`Enter team tag for Captain ${p.name}:`);
                      if (tag) {
                        run("/api/captains", "POST", { name: p.name, tag, user_id: p.id })
                          .then(() => run("/api/players", "DELETE", { playerId: p.id }));
                      }
                    }}>Make Capt.</button>
                  )}
                  <button type="button" className="text-danger" onClick={() => run("/api/players", "DELETE", { playerId: p.id })}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </form>

        <form className="space-y-2 border border-white/10 p-3" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); run("/api/captains", "POST", Object.fromEntries(f.entries())); e.currentTarget.reset(); }}>
          <p className="text-sm font-semibold">Captains {isOwner ? "(Owner)" : "(Read-only remove)"}</p>
          <input required name="name" className="w-full rounded bg-white/5 p-2" placeholder="Captain name" />
          <input required name="tag" className="w-full rounded bg-white/5 p-2" placeholder="Tag" />
          <button className="cta-primary w-full">Add Captain</button>
          <div className="space-y-2 max-h-60 overflow-auto">
            {captains.map((c) => (
              <div key={c.id} className="border border-white/10 p-2 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold">{c.name}</span>
                  {isOwner && <button type="button" className="text-danger" onClick={() => run("/api/captains", "DELETE", { captainId: c.id })}>Remove</button>}
                </div>
                {isOwner && (
                  <div className="flex gap-1 items-center">
                    <span className="text-white/50 shrink-0">User ID:</span>
                    <input
                      defaultValue={c.user_id ?? ""}
                      placeholder="Clerk user_id"
                      className="flex-1 bg-white/5 px-2 py-1 text-xs"
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val !== (c.user_id ?? "")) run("/api/captains", "PATCH", { captainId: c.id, user_id: val || null });
                      }}
                    />
                  </div>
                )}
                {!isOwner && c.user_id && <span className="text-white/40">Linked ✓</span>}
              </div>
            ))}
          </div>
        </form>

        <div className="space-y-2 border border-white/10 p-3">
          <p className="text-sm font-semibold">Teams</p>
          {teams.map((t) => (
            <div key={t.id} className="flex gap-2">
              <input defaultValue={t.name} className="w-full rounded bg-white/5 p-2 text-xs" onBlur={(e) => run("/api/admin/actions", "PATCH", { teamId: t.id, name: e.target.value })} />
            </div>
          ))}
        </div>

        <form className="space-y-2 border border-white/10 p-3 lg:col-span-2" onSubmit={submitBlockScores}>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold">Results Entry (By Block)</p>
            <select value={activeBlock} onChange={(e) => setActiveBlock(Number(e.target.value))} className="rounded bg-white/5 p-1 text-xs">
              {[1, 2, 3, 4, 5, 6].map(b => <option key={b} value={b}>Block {b}</option>)}
            </select>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[600px]">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="py-2 px-2 font-bold w-32">Team</th>
                  {seasonMatchPlan.filter(m => m.block === activeBlock).map((m, i) => (
                    <th key={m.matchNumber} className="py-2 px-1 text-center font-bold">
                      Round {i + 1}
                      <div className="text-[10px] text-white/50 font-normal">{m.roundType === "golden" ? "Golden" : "Normal"}</div>
                    </th>
                  ))}
                  <th className="py-2 px-2 text-center font-bold text-neon">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {teams.map(team => {
                  const rounds = seasonMatchPlan.filter(m => m.block === activeBlock);
                  const teamScores = blockScores[team.id] || {};
                  const total = rounds.reduce((sum, _, i) => sum + (teamScores[i] || 0), 0);
                  
                  return (
                    <tr key={team.id}>
                      <td className="py-2 px-2 font-semibold truncate">{team.name}</td>
                      {rounds.map((_, i) => (
                        <td key={i} className="py-2 px-1">
                          <input 
                            type="number" 
                            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-center" 
                            value={teamScores[i] === undefined ? "" : teamScores[i]} 
                            onChange={(e) => updateBlockScore(team.id, i, parseInt(e.target.value) || 0)}
                          />
                        </td>
                      ))}
                      <td className="py-2 px-2 text-center font-bold text-neon">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button className="cta-primary w-full mt-4" disabled={loadingScores}>
            {loadingScores ? "Loading..." : `Save Block ${activeBlock} Scores & Recalculate Standings`}
          </button>
        </form>

        <div className="space-y-2 border border-white/10 p-3 lg:col-span-2">
          <p className="text-sm font-semibold">Payment Verification</p>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by player / payer / UTR" className="w-full rounded bg-white/5 p-2 text-sm" />
          <div className="grid gap-2 sm:grid-cols-2">
            {submissions.map((s) => (
              <div key={s.user_id} className="rounded border border-white/10 p-2 text-xs space-y-1">
                <p className="font-semibold">{s.username} {s.email ? `(${s.email})` : ""}</p>
                <p>Player BGMI: {s.bgmi_name || "-"} {s.bgmi_id ? `(${s.bgmi_id})` : ""}</p>
                <p>Payer: {s.payer_name || "-"}</p>
                <p>UTR: {s.utr || "-"}</p>
                <p>Status: <span className="font-semibold">{s.status}</span></p>
                <p>Submitted: {s.submitted_at || s.updated_at || "-"}</p>
                <p>Screenshot: {s.screenshot_name || "-"}</p>
                {s.screenshot_data_url && <img src={s.screenshot_data_url} alt="Payment proof" className="h-28 w-full object-contain rounded border border-white/10" />}
                <div className="mt-1 flex gap-2">
                  <button type="button" className="text-neon" onClick={() => confirmPayment(s.user_id)}>Payment Confirmed</button>
                  <button type="button" className="text-danger" onClick={() => rejectPayment(s.user_id)}>Rejected</button>
                </div>
                {!!s.history?.length && <div className="rounded bg-white/5 p-1">{s.history.map((h) => <p key={h.id}>{h.at}: {h.note}</p>)}</div>}
              </div>
            ))}
            {!submissions.length && <p className="text-xs text-white/50">No payment submissions yet.</p>}
          </div>
        </div>

        <div className="space-y-2 border border-white/10 p-3 lg:col-span-2">
          <p className="text-sm font-semibold">Auction Controls</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded border border-white/20 px-3 py-2 text-xs" onClick={() => run("/api/auction/state", "POST", { action: "start" })}>Start</button>
            <button type="button" className="rounded border border-white/20 px-3 py-2 text-xs" onClick={() => run("/api/auction/state", "POST", { action: "draw_next" })}>Draw Next</button>
            <button type="button" className="rounded border border-white/20 px-3 py-2 text-xs" onClick={() => run("/api/auction/state", "POST", { action: "open_selection" })}>Open Selection</button>
            <button type="button" className="rounded border border-white/20 px-3 py-2 text-xs" onClick={() => run("/api/auction/state", "POST", { action: "next" })}>Proceed</button>
            <button type="button" className="rounded border border-white/20 px-3 py-2 text-xs" onClick={() => run("/api/auction/state", "POST", { action: "reset" })}>Reset Stage</button>
            {isOwner && <button type="button" className="rounded border border-danger/30 px-3 py-2 text-xs text-danger" onClick={() => run("/api/admin/actions", "POST", { action: "reset_auction" })}>Owner Full Reset</button>}
          </div>
        </div>
      </div>}
    </section>
  );
}
