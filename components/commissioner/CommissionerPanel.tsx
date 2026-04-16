"use client";

import { FormEvent, useEffect, useState } from "react";
import { fetchJSON } from "@/lib/services/http";
import { matchPlan } from "@/lib/config/season";

interface Team { id: string; name: string }
interface Captain { id: string; name: string }
interface Player { id: string; name: string; role: string }
interface Submission { user_id: string; username: string; payer_name?: string; utr?: string; status: string; screenshot_name?: string; submitted_at?: string; history?: { status: string; at: string }[]; bgmi_name?: string; bgmi_id?: string }
type Role = "owner" | "staff";

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

  const isOwner = enabled && role === "owner";

  const load = () => {
    fetchJSON<{ enabled: boolean; role: Role | null }>("/api/commissioner/session").then((d) => { setEnabled(d.enabled); if (d.role) setRole(d.role); }).catch(() => setEnabled(false));
    fetchJSON<{ teams: Team[] }>("/api/teams").then((d) => setTeams(d.teams ?? [])).catch(() => null);
    fetchJSON<{ captains: Captain[] }>("/api/captains").then((d) => setCaptains(d.captains ?? [])).catch(() => null);
    fetchJSON<{ players: Player[] }>("/api/players").then((d) => setPlayers(d.players ?? [])).catch(() => null);
    if (enabled) fetchJSON<{ submissions: Submission[] }>(`/api/payment/submissions?q=${encodeURIComponent(search)}`).then((d) => setSubmissions(d.submissions ?? [])).catch(() => setSubmissions([]));
  };

  useEffect(() => { load(); }, [enabled, search]);

  const unlock = async (e: FormEvent) => {
    e.preventDefault();
    await fetchJSON("/api/commissioner/session", { method: "POST", body: JSON.stringify({ passcode, role }) });
    setPasscode("");
    setEnabled(true);
    setMessage(`Commissioner Mode Active — ${role === "owner" ? "Owner" : "Staff"}`);
    load();
  };

  const run = async (url: string, method = "POST", body?: Record<string, unknown>) => {
    await fetchJSON(url, { method, body: body ? JSON.stringify(body) : undefined });
    setMessage("Saved.");
    load();
  };

  return (
    <section className="card p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold">Commissioner Console</h2>
        {enabled && <span className="rounded-full bg-neon/15 text-neon px-3 py-1 text-xs uppercase">Commissioner Mode Active — {role === "owner" ? "Owner" : "Staff"}</span>}
      </div>

      {!enabled ? (
        <form onSubmit={unlock} className="grid gap-2 sm:grid-cols-3">
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="rounded bg-white/5 p-2"><option value="owner">Owner</option><option value="staff">Staff</option></select>
          <input required value={passcode} onChange={(e) => setPasscode(e.target.value)} type="password" className="rounded bg-white/5 p-2" placeholder="Commissioner passcode" />
          <button className="cta-primary">Unlock</button>
        </form>
      ) : (
        <button className="cta-ghost" onClick={() => run("/api/commissioner/session", "DELETE")}>Exit Commissioner Mode</button>
      )}
      {message && <p className="text-sm text-neon">{message}</p>}

      {enabled && <div className="grid gap-4 lg:grid-cols-2">
        <form className="border border-white/10 p-3 space-y-2" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); run("/api/players", "POST", Object.fromEntries(fd.entries())); e.currentTarget.reset(); }}>
          <p className="font-semibold text-sm">Players (staff)</p>
          <input required name="name" className="w-full rounded bg-white/5 p-2" placeholder="Player name" />
          <input required name="region" className="w-full rounded bg-white/5 p-2" placeholder="Region" />
          <input required name="style" className="w-full rounded bg-white/5 p-2" placeholder="Style" />
          <select required name="role" className="w-full rounded bg-white/5 p-2"><option>Assaulter</option><option>Support</option><option>IGL</option><option>Sniper</option><option>Flexible</option></select>
          <button className="cta-primary w-full">Add Player</button>
          <div className="max-h-24 overflow-auto text-xs">{players.map((p) => <div key={p.id} className="flex justify-between"><span>{p.name}</span><button type="button" className="text-danger" onClick={() => run("/api/players", "DELETE", { playerId: p.id })}>Remove</button></div>)}</div>
        </form>

        <form className="border border-white/10 p-3 space-y-2" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); run("/api/captains", "POST", Object.fromEntries(fd.entries())); e.currentTarget.reset(); }}>
          <p className="font-semibold text-sm">Captains & Teams (owner/staff)</p>
          <input required name="name" className="w-full rounded bg-white/5 p-2" placeholder="Captain name" />
          <input required name="tag" className="w-full rounded bg-white/5 p-2" placeholder="Tag" />
          <input required name="region" className="w-full rounded bg-white/5 p-2" placeholder="Region" />
          <button className="cta-primary w-full">Add Captain</button>
          <div className="max-h-24 overflow-auto text-xs">{captains.map((c) => <div key={c.id} className="flex justify-between"><span>{c.name}</span><button type="button" className="text-danger" onClick={() => run("/api/captains", "DELETE", { captainId: c.id })}>Remove</button></div>)}</div>
          {teams.map((t) => <input key={t.id} defaultValue={t.name} onBlur={(e) => run("/api/admin/actions", "PATCH", { teamId: t.id, name: e.target.value })} className="w-full rounded bg-white/5 p-2 text-xs" />)}
        </form>

        <form className="border border-white/10 p-3 space-y-2 lg:col-span-2" onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const matchNumber = Number(fd.get("matchNumber"));
          const roundType = String(fd.get("roundType"));
          const map = String(fd.get("map"));
          const winnerTeamId = String(fd.get("winnerTeamId"));
          const teamResults = teams.map((t) => ({
            teamId: t.id,
            placement: Number(fd.get(`placement_${t.id}`)),
            kills: Number(fd.get(`kills_${t.id}`)),
            bonusType: String(fd.get(`bonus_${t.id}`) || "none"),
            nominatedPlayerKills: Number(fd.get(`nominated_${t.id}`) || 0)
          }));
          run("/api/results", "POST", { matchNumber, roundType, map, winnerTeamId, teamResults });
        }}>
          <p className="font-semibold text-sm">Results Editor (staff)</p>
          <div className="grid gap-2 sm:grid-cols-4">
            <select name="matchNumber" className="rounded bg-white/5 p-2">{matchPlan.map((m) => <option key={m.matchNumber} value={m.matchNumber}>Match {m.matchNumber} (Block {m.block} {m.roundType})</option>)}</select>
            <select name="roundType" className="rounded bg-white/5 p-2"><option value="normal">normal</option><option value="golden">golden</option></select>
            <input name="map" defaultValue="Erangel" className="rounded bg-white/5 p-2" />
            <select name="winnerTeamId" className="rounded bg-white/5 p-2">{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          </div>
          {teams.map((t) => (
            <div key={t.id} className="grid gap-2 sm:grid-cols-5 text-xs">
              <div className="p-2">{t.name}</div>
              <input name={`placement_${t.id}`} type="number" min={1} max={3} defaultValue={1} className="rounded bg-white/5 p-2" placeholder="placement" />
              <input name={`kills_${t.id}`} type="number" min={0} defaultValue={0} className="rounded bg-white/5 p-2" placeholder="kills" />
              <select name={`bonus_${t.id}`} className="rounded bg-white/5 p-2"><option value="none">no bonus</option><option value="back_to_back">back-to-back</option><option value="threepeat">threepeat</option></select>
              <input name={`nominated_${t.id}`} type="number" min={0} defaultValue={0} className="rounded bg-white/5 p-2" placeholder="golden x2 kills" />
            </div>
          ))}
          <button className="cta-primary">Save Match Result</button>
        </form>

        <div className="border border-white/10 p-3 space-y-2 lg:col-span-2">
          <p className="font-semibold text-sm">Payment Verification (owner/staff)</p>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search player / UTR" className="w-full rounded bg-white/5 p-2 text-sm" />
          <div className="grid gap-2 sm:grid-cols-2">
            {submissions.map((s) => (
              <div key={s.user_id} className="rounded border border-white/10 p-2 text-xs space-y-1">
                <p><strong>{s.username}</strong> {s.bgmi_name ? `• ${s.bgmi_name}` : ""}</p>
                <p>Status: {s.status}</p>
                <p>UTR: {s.utr || "-"}</p>
                <p>Payer: {s.payer_name || "-"}</p>
                <p>Screenshot: {s.screenshot_name || "-"}</p>
                <p>Submitted: {s.submitted_at || "-"}</p>
                {s.history?.length ? <p>History: {s.history.map((h) => `${h.status}@${new Date(h.at).toLocaleString()}`).join(" | ")}</p> : null}
                <div className="flex gap-2">
                  <button type="button" className="text-neon" onClick={() => run("/api/payment", "PATCH", { userId: s.user_id, action: "confirm" })}>Payment Confirmed</button>
                  <button type="button" className="text-danger" onClick={() => run("/api/payment", "PATCH", { userId: s.user_id, action: "reject" })}>Rejected</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-white/10 p-3 lg:col-span-2">
          <p className="font-semibold text-sm">Auction Operations</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="rounded border border-white/20 px-3 py-2 text-xs" onClick={() => run("/api/auction/state", "POST", { action: "start" })}>Start</button>
            <button type="button" className="rounded border border-white/20 px-3 py-2 text-xs" onClick={() => run("/api/auction/state", "POST", { action: "draw_next" })}>Draw Next</button>
            <button type="button" className="rounded border border-white/20 px-3 py-2 text-xs" onClick={() => run("/api/auction/state", "POST", { action: "open_selection" })}>Open Selection</button>
            <button type="button" className="rounded border border-white/20 px-3 py-2 text-xs" onClick={() => run("/api/auction/state", "POST", { action: "next" })}>Proceed</button>
            <button type="button" className="rounded border border-white/20 px-3 py-2 text-xs" onClick={() => run("/api/auction/state", "POST", { action: "reset" })}>Reset Stage</button>
            {isOwner && <button type="button" className="rounded border border-danger/40 px-3 py-2 text-xs text-danger" onClick={() => run("/api/admin/actions", "POST", { action: "reset_auction" })}>Owner Full Reset</button>}
          </div>
        </div>
      </div>}
    </section>
  );
}
