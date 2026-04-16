"use client";

import { FormEvent, useEffect, useState } from "react";
import { fetchJSON } from "@/lib/services/http";

interface Team { id: string; name: string }
interface Captain { id: string; name: string; tag: string; region: string }
interface Player { id: string; name: string; role: string; region: string; style: string }
interface Submission { user_id: string; username: string; payer_name?: string; utr?: string; status: string }

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
    setMessage(`Commissioner Mode Active (${role.toUpperCase()})`);
    load();
  };

  const lock = async () => {
    await fetchJSON("/api/commissioner/session", { method: "DELETE" });
    setEnabled(false);
    setMessage("Commissioner mode locked.");
  };

  const run = async (url: string, method = "POST", body?: Record<string, unknown>) => {
    await fetchJSON(url, { method, body: body ? JSON.stringify(body) : undefined });
    setMessage("Action saved.");
    load();
  };

  return (
    <section className="card p-4 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">Commissioner Mode</h2>
          <p className="text-sm text-white/70">Owner + Staff operations for auction, payments, and match control. Public users see none of these controls.</p>
        </div>
        {enabled && <span className="rounded-full bg-neon/15 text-neon px-3 py-1 text-xs uppercase">Commissioner Mode Active ({role})</span>}
      </div>

      {!enabled ? (
        <form onSubmit={unlock} className="grid gap-2 sm:grid-cols-3">
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="rounded-lg bg-white/5 px-3 py-2"><option value="staff">Staff</option><option value="owner">Owner</option></select>
          <input required type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} className="rounded-lg bg-white/5 px-3 py-2" placeholder="Enter passcode" />
          <button className="cta-primary">Unlock</button>
        </form>
      ) : <button className="cta-ghost" onClick={lock}>Lock Commissioner Mode</button>}

      {message && <p className="text-sm text-neon">{message}</p>}

      {enabled && (
        <div className="grid gap-4 lg:grid-cols-2">
          <form className="space-y-2 border border-white/10 p-3" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); run("/api/players", "POST", Object.fromEntries(f.entries())); e.currentTarget.reset(); }}>
            <p className="text-sm font-semibold">Players</p>
            <input required name="name" className="w-full rounded bg-white/5 p-2" placeholder="Player name" />
            <input required name="region" className="w-full rounded bg-white/5 p-2" placeholder="Region" />
            <input required name="style" className="w-full rounded bg-white/5 p-2" placeholder="Play style" />
            <select required name="role" className="w-full rounded bg-white/5 p-2"><option>Assaulter</option><option>Support</option><option>IGL</option><option>Sniper</option><option>Flexible</option></select>
            <button className="cta-primary w-full">Add Player</button>
            <div className="space-y-1 max-h-40 overflow-auto">{players.map((p) => <div key={p.id} className="flex justify-between text-xs"><span>{p.name}</span><button type="button" className="text-danger" onClick={() => run("/api/players", "DELETE", { playerId: p.id })}>Remove</button></div>)}</div>
          </form>

          <form className="space-y-2 border border-white/10 p-3" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); run("/api/captains", "POST", Object.fromEntries(f.entries())); e.currentTarget.reset(); }}>
            <p className="text-sm font-semibold">Captains & Teams</p>
            <input required name="name" className="w-full rounded bg-white/5 p-2" placeholder="Captain name" />
            <input required name="tag" className="w-full rounded bg-white/5 p-2" placeholder="Tag" />
            <input required name="region" className="w-full rounded bg-white/5 p-2" placeholder="Region" />
            <button className="cta-primary w-full">Add Captain</button>
            <div className="space-y-1 max-h-40 overflow-auto">{captains.map((c) => <div key={c.id} className="flex justify-between text-xs"><span>{c.name}</span><button type="button" className="text-danger" onClick={() => run("/api/captains", "DELETE", { captainId: c.id })}>Remove</button></div>)}</div>
            <div className="space-y-1">{teams.map((t) => <form key={t.id} className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); run("/api/admin/actions", "PATCH", { teamId: t.id, name: fd.get("name") }); }}><input name="name" defaultValue={t.name} className="w-full rounded bg-white/5 p-2 text-xs" /><button className="text-xs">Save</button></form>)}</div>
          </form>

          <form className="space-y-2 border border-white/10 p-3" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); run("/api/results", "POST", { teamId: f.get("teamId"), placement: Number(f.get("placement")), kills: Number(f.get("kills")), isGoldenRound: f.get("isGoldenRound") === "on", nominatedPlayerKills: Number(f.get("nominatedPlayerKills")), bonusType: f.get("bonusType") }); }}>
            <p className="text-sm font-semibold">Results / Standings</p>
            <select name="teamId" className="w-full rounded bg-white/5 p-2">{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
            <select name="placement" className="w-full rounded bg-white/5 p-2"><option value="1">1st</option><option value="2">2nd</option><option value="3">3rd</option></select>
            <input name="kills" type="number" min={0} defaultValue={0} className="w-full rounded bg-white/5 p-2" placeholder="Kills" />
            <label className="flex items-center gap-2 text-sm"><input name="isGoldenRound" type="checkbox"/> Golden round</label>
            <input name="nominatedPlayerKills" type="number" min={0} defaultValue={0} className="w-full rounded bg-white/5 p-2" placeholder="Nominated x2 kills" />
            <select name="bonusType" className="w-full rounded bg-white/5 p-2"><option value="none">No bonus</option><option value="back_to_back">Back-to-back</option><option value="threepeat">Threepeat</option></select>
            <button className="cta-primary w-full">Submit Result</button>
          </form>

          <div className="space-y-2 border border-white/10 p-3">
            <p className="text-sm font-semibold">Payments</p>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by player / payer / UTR" className="w-full rounded bg-white/5 p-2 text-sm" />
            <div className="space-y-1 max-h-56 overflow-auto">
              {submissions.map((s) => (
                <div key={s.user_id} className="rounded border border-white/10 p-2 text-xs">
                  <p>{s.username} • {s.payer_name || "-"}</p>
                  <p>UTR: {s.utr || "-"} • {s.status}</p>
                  <div className="mt-1 flex gap-2">
                    <button className="text-neon" onClick={() => run("/api/payment", "PATCH", { userId: s.user_id, action: "confirm" })}>Confirm</button>
                    <button className="text-danger" onClick={() => run("/api/payment", "PATCH", { userId: s.user_id, action: "reject" })}>Reject</button>
                  </div>
                </div>
              ))}
              {!submissions.length && <p className="text-xs text-white/50">No payment submissions yet.</p>}
            </div>
          </div>

          <div className="space-y-2 border border-white/10 p-3 lg:col-span-2">
            <p className="text-sm font-semibold">Auction Controls</p>
            <div className="flex flex-wrap gap-2">
              <button className="rounded border border-white/20 px-3 py-2 text-xs" onClick={() => run("/api/auction/state", "POST", { action: "start" })}>Start Auction</button>
              <button className="rounded border border-white/20 px-3 py-2 text-xs" onClick={() => run("/api/auction/state", "POST", { action: "draw_next" })}>Draw Next</button>
              <button className="rounded border border-white/20 px-3 py-2 text-xs" onClick={() => run("/api/auction/state", "POST", { action: "open_selection" })}>Open Selection</button>
              <button className="rounded border border-white/20 px-3 py-2 text-xs" onClick={() => run("/api/auction/state", "POST", { action: "next" })}>Proceed</button>
              <button className="rounded border border-white/20 px-3 py-2 text-xs" onClick={() => run("/api/auction/state", "POST", { action: "reset" })}>Reset Stage</button>
              {isOwner && <button className="rounded border border-danger/30 px-3 py-2 text-xs text-danger" onClick={() => run("/api/admin/actions", "POST", { action: "reset_auction" })}>Owner Full Reset</button>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
