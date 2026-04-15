"use client";

import { FormEvent, useEffect, useState } from "react";
import { fetchJSON } from "@/lib/services/http";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  email_verified: boolean;
}

interface AuctionPlayerRow {
  id: string;
  name: string;
}

export function AdminControls() {
  const [message, setMessage] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auctionPlayers, setAuctionPlayers] = useState<AuctionPlayerRow[]>([]);

  const loadUsers = () => fetchJSON<{ users: AdminUser[] }>("/api/admin/users").then((d) => setUsers(d.users)).catch(() => null);
  const loadPlayers = () => fetchJSON<{ players: AuctionPlayerRow[] }>("/api/players").then((d) => setAuctionPlayers(d.players)).catch(() => null);

  useEffect(() => {
    loadUsers();
    loadPlayers();
  }, []);

  const submit = async (e: FormEvent<HTMLFormElement>, route: string) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    await fetchJSON(route, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: adminKey ? { "x-admin-key": adminKey } : undefined
    });
    e.currentTarget.reset();
    setMessage(`Saved to ${route}`);
    loadUsers();
    loadPlayers();
  };

  const adminAction = async (action: string, payload: Record<string, string> = {}) => {
    await fetchJSON("/api/admin/actions", { method: "POST", body: JSON.stringify({ action, ...payload }) });
    setMessage(`Executed ${action}`);
    loadUsers();
  };

  return (
    <section className="space-y-4">
      <section className="card p-5">
        <h2 className="text-2xl font-bold">PlayGFL Admin Control Center</h2>
        <p className="mt-2 text-sm text-white/70">Manage captains, player approvals, auction pool, and PlayGFL Season 2 tournament controls.</p>
        <input
          name="adminKey"
          placeholder="Optional admin API key"
          className="mt-3 w-full rounded-lg bg-white/5 p-2"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
        />
        {message && <p className="mt-2 text-sm text-neon">{message}</p>}
      </section>

      <section className="card p-4">
        <h3 className="font-semibold">Auction Session Controls</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="rounded-lg bg-accent px-3 py-2 text-sm" onClick={() => adminAction("start_auction")}>Start Auction Session</button>
          <button className="rounded-lg bg-white/10 px-3 py-2 text-sm" onClick={() => adminAction("reset_auction")}>Reset Auction Session</button>
          <button className="rounded-lg bg-danger/20 px-3 py-2 text-sm" onClick={() => adminAction("close_auction")}>Close Auction Session</button>
        </div>
      </section>

      <form className="card space-y-2 p-4" onSubmit={(e) => submit(e, "/api/captains")}> 
        <h3 className="font-semibold">Add Captain</h3>
        <input required name="name" placeholder="Captain name" className="w-full rounded-lg bg-white/5 p-2" />
        <input required name="tag" placeholder="Tag (e.g. RVN)" className="w-full rounded-lg bg-white/5 p-2" />
        <input required name="region" placeholder="Region" className="w-full rounded-lg bg-white/5 p-2" />
        <button className="rounded-lg bg-accent px-3 py-2 text-sm">Save Captain</button>
      </form>

      <form className="card space-y-2 p-4" onSubmit={(e) => submit(e, "/api/players")}> 
        <h3 className="font-semibold">Add Player</h3>
        <input required name="name" placeholder="Player name" className="w-full rounded-lg bg-white/5 p-2" />
        <select required name="role" className="w-full rounded-lg bg-white/5 p-2">
          <option value="Assaulter">Assaulter</option>
          <option value="Support">Support</option>
          <option value="IGL">IGL</option>
          <option value="Sniper">Sniper</option>
          <option value="Flexible">Flexible</option>
        </select>
        <input required name="region" placeholder="Region" className="w-full rounded-lg bg-white/5 p-2" />
        <input required name="style" placeholder="Play style" className="w-full rounded-lg bg-white/5 p-2" />
        <button className="rounded-lg bg-accent px-3 py-2 text-sm">Save Player</button>
      </form>

      <section className="card p-4">
        <h3 className="font-semibold">User Roles & Shortlist</h3>
        <div className="mt-3 space-y-2">
          {users.length ? users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 border border-white/10 p-2">
              <div>
                <p className="font-semibold">{u.username}</p>
                <p className="text-xs text-white/60">{u.email} · {u.role} · {u.email_verified ? "Verified" : "Not verified"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                                <button className="rounded-lg bg-white/10 px-3 py-2 text-xs" onClick={() => adminAction("shortlist_player", { userId: u.id })}>Shortlist</button>
                <button className="rounded-lg bg-white/10 px-3 py-2 text-xs" onClick={() => adminAction("assign_user_role", { userId: u.id, role: "captain" })}>Make Captain</button>
                <button className="rounded-lg bg-white/10 px-3 py-2 text-xs" onClick={() => adminAction("assign_user_role", { userId: u.id, role: "admin" })}>Make Admin</button>
              </div>
            </div>
          )) : <p className="text-sm text-white/60">No registered users available yet.</p>}
        </div>
      </section>

      <section className="card p-4">
        <h3 className="font-semibold">Move Player to Auction Pool</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {auctionPlayers.length ? auctionPlayers.map((p) => (
            <button key={p.id} className="rounded-lg border border-white/15 px-3 py-2 text-left text-sm" onClick={() => adminAction("move_to_auction_pool", { playerId: p.id })}>
              {p.name}
            </button>
          )) : <p className="text-sm text-white/60">No players available to move yet.</p>}
        </div>
      </section>

      <form className="card space-y-2 p-4" onSubmit={(e) => submit(e, "/api/announcements")}> 
        <h3 className="font-semibold">Post Announcement</h3>
        <input required name="title" placeholder="Title" className="w-full rounded-lg bg-white/5 p-2" />
        <textarea required name="body" placeholder="Body" className="w-full rounded-lg bg-white/5 p-2" rows={3} />
        <select name="priority" className="w-full rounded-lg bg-white/5 p-2">
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button className="rounded-lg bg-accent px-3 py-2 text-sm">Publish</button>
      </form>

      <form className="card space-y-2 p-4" onSubmit={(e) => submit(e, "/api/admin/actions")}> 
        <h3 className="font-semibold">Manage Tournament Metadata</h3>
        <input name="action" type="hidden" value="update_tournament" />
        <input required name="id" defaultValue="gfl-s1" placeholder="Tournament ID" className="w-full rounded-lg bg-white/5 p-2" />
        <input required name="name" defaultValue="PlayGFL Season 2" placeholder="Tournament Name" className="w-full rounded-lg bg-white/5 p-2" />
        <input required name="format" defaultValue="3 captains draft auction players" placeholder="Format" className="w-full rounded-lg bg-white/5 p-2" />
        <button className="rounded-lg bg-accent px-3 py-2 text-sm">Update Tournament</button>
      </form>
    </section>
  );
}
