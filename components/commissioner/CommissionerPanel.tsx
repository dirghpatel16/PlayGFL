"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { fetchJSON } from "@/lib/services/http";
import { seasonMatchPlan } from "@/lib/config/matchFormat";

interface Team { id: string; name: string }
interface Captain { id: string; name: string; tag: string; region: string }
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

type BonusType = "none" | "back_to_back" | "threepeat";

interface ResultRowInput {
  teamId: string;
  placement: number;
  kills: number;
  bonusType: BonusType;
  nominatedPlayerKills: number;
}

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
  const [matchNumber, setMatchNumber] = useState(1);
  const [resultRows, setResultRows] = useState<ResultRowInput[]>([]);

  const isOwner = enabled && role === "owner";
  const selectedMatch = seasonMatchPlan.find((m) => m.matchNumber === matchNumber);

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
    setResultRows(teams.map((team) => ({ teamId: team.id, placement: 1, kills: 0, bonusType: "none", nominatedPlayerKills: 0 })));
  }, [teams]);

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

  const updateResultRow = (teamId: string, patch: Partial<ResultRowInput>) => {
    setResultRows((prev) => prev.map((row) => (row.teamId === teamId ? { ...row, ...patch } : row)));
  };

  const submitMatchResults = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    await fetchJSON("/api/results", {
      method: "POST",
      body: JSON.stringify({
        matchNumber,
        roundType: selectedMatch.roundType,
        map: selectedMatch.map,
        entries: resultRows
      })
    });
    setMessage(`Saved Match ${matchNumber} (${selectedMatch.roundType.toUpperCase()}) and updated standings.`);
  };

  const ownerCapabilities = useMemo(() => [
    "Verify/reject payments",
    "Add/remove captains",
    "Rename teams",
    "Manage auction pool",
    "Edit results & standings",
    "Owner reset controls"
  ], []);

  const staffCapabilities = useMemo(() => [
    "Verify/reject payments",
    "Run auction operations",
    "Add/edit players",
    "Enter results and update standings"
  ], []);

  return (
    <section className="card p-4 space-y-4">
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
          <input required name="region" className="w-full rounded bg-white/5 p-2" placeholder="Region" />
          <input required name="style" className="w-full rounded bg-white/5 p-2" placeholder="Play style" />
          <select required name="role" className="w-full rounded bg-white/5 p-2"><option>Assaulter</option><option>Support</option><option>IGL</option><option>Sniper</option><option>Flexible</option></select>
          <button className="cta-primary w-full">Add Player</button>
          <div className="space-y-1 max-h-40 overflow-auto">
            {players.map((p) => <div key={p.id} className="flex justify-between text-xs"><span>{p.name}</span><button type="button" className="text-danger" onClick={() => run("/api/players", "DELETE", { playerId: p.id })}>Remove</button></div>)}
          </div>
        </form>

        <form className="space-y-2 border border-white/10 p-3" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); run("/api/captains", "POST", Object.fromEntries(f.entries())); e.currentTarget.reset(); }}>
          <p className="text-sm font-semibold">Captains {isOwner ? "(Owner)" : "(Read-only remove)"}</p>
          <input required name="name" className="w-full rounded bg-white/5 p-2" placeholder="Captain name" />
          <input required name="tag" className="w-full rounded bg-white/5 p-2" placeholder="Tag" />
          <input required name="region" className="w-full rounded bg-white/5 p-2" placeholder="Region" />
          <button className="cta-primary w-full">Add Captain</button>
          <div className="space-y-1 max-h-40 overflow-auto">
            {captains.map((c) => <div key={c.id} className="flex justify-between text-xs"><span>{c.name}</span>{isOwner && <button type="button" className="text-danger" onClick={() => run("/api/captains", "DELETE", { captainId: c.id })}>Remove</button>}</div>)}
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

        <form className="space-y-2 border border-white/10 p-3" onSubmit={submitMatchResults}>
          <p className="text-sm font-semibold">Results Entry & Standings Update</p>
          <select value={matchNumber} onChange={(e) => setMatchNumber(Number(e.target.value))} className="w-full rounded bg-white/5 p-2">
            {seasonMatchPlan.map((m) => <option key={m.matchNumber} value={m.matchNumber}>Match {m.matchNumber} • Block {m.block} • {m.roundType === "golden" ? "Golden" : "Normal"}</option>)}
          </select>
          <p className="text-xs text-white/70">Map: {selectedMatch?.map}</p>
          <div className="space-y-2 max-h-64 overflow-auto">
            {resultRows.map((row) => (
              <div key={row.teamId} className="rounded border border-white/10 p-2 grid grid-cols-2 gap-2 text-xs">
                <p className="col-span-2 font-semibold">{teams.find((t) => t.id === row.teamId)?.name || row.teamId}</p>
                <input type="number" min={1} max={99} value={row.placement} onChange={(e) => updateResultRow(row.teamId, { placement: Number(e.target.value) })} className="rounded bg-white/5 p-2" placeholder="Placement" />
                <input type="number" min={0} value={row.kills} onChange={(e) => updateResultRow(row.teamId, { kills: Number(e.target.value) })} className="rounded bg-white/5 p-2" placeholder="Kills" />
                <select value={row.bonusType} onChange={(e) => updateResultRow(row.teamId, { bonusType: e.target.value as BonusType })} className="rounded bg-white/5 p-2">
                  <option value="none">No bonus</option><option value="back_to_back">Back-to-back</option><option value="threepeat">Three back-to-back</option>
                </select>
                <input type="number" min={0} value={row.nominatedPlayerKills} onChange={(e) => updateResultRow(row.teamId, { nominatedPlayerKills: Number(e.target.value) })} className="rounded bg-white/5 p-2" placeholder="Nominated x2 kills" disabled={selectedMatch?.roundType !== "golden"} />
              </div>
            ))}
          </div>
          <button className="cta-primary w-full">Save Match & Recalculate Standings</button>
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
                  <button type="button" className="text-neon" onClick={() => run("/api/payment", "PATCH", { userId: s.user_id, action: "confirm" })}>Payment Confirmed</button>
                  <button type="button" className="text-danger" onClick={() => run("/api/payment", "PATCH", { userId: s.user_id, action: "reject" })}>Rejected</button>
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
