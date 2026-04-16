"use client";

import { FormEvent, useEffect, useState } from "react";
import { fetchJSON } from "@/lib/services/http";

interface Team {
  id: string;
  name: string;
}
interface Captain { id: string; name: string; tag: string; region: string }
interface Player { id: string; name: string; role: string; region: string; style: string }

export function CommissionerPanel() {
  const [enabled, setEnabled] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [message, setMessage] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [captains, setCaptains] = useState<Captain[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  const load = () => {
    fetchJSON<{ enabled: boolean }>("/api/commissioner/session").then((d) => setEnabled(d.enabled)).catch(() => setEnabled(false));
    fetchJSON<{ teams: Team[] }>("/api/teams").then((d) => setTeams(d.teams ?? [])).catch(() => null);
    fetchJSON<{ captains: Captain[] }>("/api/captains").then((d) => setCaptains(d.captains ?? [])).catch(() => null);
    fetchJSON<{ players: Player[] }>("/api/players").then((d) => setPlayers(d.players ?? [])).catch(() => null);
  };

  useEffect(() => {
    load();
  }, []);

  const unlock = async (e: FormEvent) => {
    e.preventDefault();
    await fetchJSON("/api/commissioner/session", { method: "POST", body: JSON.stringify({ passcode }) });
    setPasscode("");
    setEnabled(true);
    setMessage("Commissioner mode unlocked.");
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Commissioner Mode</h2>
          <p className="text-sm text-white/70">Unlock lightweight operations with passcode. Controls remain hidden for public viewers.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.14em] ${enabled ? "bg-neon/15 text-neon" : "bg-white/10 text-white/70"}`}>{enabled ? "Unlocked" : "Locked"}</span>
      </div>

      {!enabled ? (
        <form onSubmit={unlock} className="flex flex-col gap-2 sm:flex-row">
          <input required type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} className="rounded-lg bg-white/5 px-3 py-2" placeholder="Enter commissioner passcode" />
          <button className="cta-primary">Unlock</button>
        </form>
      ) : (
        <button className="cta-ghost" onClick={lock}>Lock Commissioner Mode</button>
      )}

      {message && <p className="text-sm text-neon">{message}</p>}

      {enabled && (
        <div className="grid gap-4 lg:grid-cols-2">
          <form className="space-y-2 border border-white/10 p-3" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); run("/api/players", "POST", Object.fromEntries(f.entries())); e.currentTarget.reset(); }}>
            <p className="text-sm font-semibold">Add Player</p>
            <input required name="name" className="w-full rounded bg-white/5 p-2" placeholder="Player name" />
            <input required name="region" className="w-full rounded bg-white/5 p-2" placeholder="Region" />
            <input required name="style" className="w-full rounded bg-white/5 p-2" placeholder="Play style" />
            <select required name="role" className="w-full rounded bg-white/5 p-2"><option>Assaulter</option><option>Support</option><option>IGL</option><option>Sniper</option><option>Flexible</option></select>
            <button className="cta-primary w-full">Save Player</button>
          </form>

          <form className="space-y-2 border border-white/10 p-3" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); run("/api/captains", "POST", Object.fromEntries(f.entries())); e.currentTarget.reset(); }}>
            <p className="text-sm font-semibold">Add Captain</p>
            <input required name="name" className="w-full rounded bg-white/5 p-2" placeholder="Captain name" />
            <input required name="tag" className="w-full rounded bg-white/5 p-2" placeholder="Tag" />
            <input required name="region" className="w-full rounded bg-white/5 p-2" placeholder="Region" />
            <button className="cta-primary w-full">Save Captain</button>
          </form>

          <div className="space-y-2 border border-white/10 p-3">
            <p className="text-sm font-semibold">Edit Teams</p>
            {teams.map((t) => (
              <form key={t.id} className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); run("/api/admin/actions", "PATCH", { teamId: t.id, name: fd.get("name") }); }}>
                <input name="name" defaultValue={t.name} className="w-full rounded bg-white/5 p-2" />
                <button className="rounded border border-white/20 px-3">Save</button>
              </form>
            ))}
          </div>

          <form className="space-y-2 border border-white/10 p-3" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); run("/api/results", "POST", { teamId: f.get("teamId"), placement: Number(f.get("placement")), kills: Number(f.get("kills")), isGoldenRound: f.get("isGoldenRound") === "on", nominatedPlayerKills: Number(f.get("nominatedPlayerKills")), bonusType: f.get("bonusType") }); }}>
            <p className="text-sm font-semibold">Enter Match Result</p>
            <select name="teamId" className="w-full rounded bg-white/5 p-2">{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
            <select name="placement" className="w-full rounded bg-white/5 p-2"><option value="1">1st</option><option value="2">2nd</option><option value="3">3rd</option></select>
            <input name="kills" type="number" min={0} defaultValue={0} className="w-full rounded bg-white/5 p-2" placeholder="Kills" />
            <label className="flex items-center gap-2 text-sm"><input name="isGoldenRound" type="checkbox"/> Golden round</label>
            <input name="nominatedPlayerKills" type="number" min={0} defaultValue={0} className="w-full rounded bg-white/5 p-2" placeholder="Nominated player kills (x2)" />
            <select name="bonusType" className="w-full rounded bg-white/5 p-2"><option value="none">No bonus</option><option value="back_to_back">Back-to-back +5</option><option value="threepeat">Threepeat +10</option></select>
            <button className="cta-primary w-full">Submit Result</button>
          </form>

          <div className="space-y-2 border border-white/10 p-3 lg:col-span-2">
            <p className="text-sm font-semibold">Quick Actions</p>
            <div className="flex flex-wrap gap-2">
              <button className="rounded border border-white/20 px-3 py-2 text-xs" onClick={() => run("/api/auction/state", "POST", { action: "start" })}>Start Auction</button>
              <button className="rounded border border-white/20 px-3 py-2 text-xs" onClick={() => run("/api/auction/state", "POST", { action: "draw_next" })}>Draw Next</button>
              <button className="rounded border border-white/20 px-3 py-2 text-xs" onClick={() => run("/api/auction/state", "POST", { action: "next" })}>Proceed Next</button>
              <button className="rounded border border-danger/30 px-3 py-2 text-xs text-danger" onClick={() => run("/api/auction/state", "POST", { action: "reset" })}>Reset Auction</button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {players.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded border border-white/10 px-2 py-1 text-xs">
                  <span>{p.name}</span>
                  <div className="flex gap-2">
                    <button className="text-neon" onClick={() => run("/api/admin/actions", "POST", { action: "move_to_auction_pool", playerId: p.id })}>Add to Pool</button>
                    <button className="text-danger" onClick={() => run("/api/players", "DELETE", { playerId: p.id })}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {captains.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded border border-white/10 px-2 py-1 text-xs">
                  <span>{c.name}</span>
                  <button className="text-danger" onClick={() => run("/api/captains", "DELETE", { captainId: c.id })}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
