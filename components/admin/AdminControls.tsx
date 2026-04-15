"use client";

import { FormEvent, useState } from "react";
import { fetchJSON } from "@/lib/services/http";

export function AdminControls() {
  const [message, setMessage] = useState("");
  const [adminKey, setAdminKey] = useState("");

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
  };

  return (
    <section className="space-y-4">
      <section className="card p-5">
        <h2 className="text-2xl font-bold">Admin Control Center</h2>
        <p className="mt-2 text-sm text-white/70">Create real captains, players, teams and announcements. No preset names are used now.</p>
        <input
          name="adminKey"
          placeholder="Optional admin API key"
          className="mt-3 w-full rounded-lg bg-white/5 p-2"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
        />
        {message && <p className="mt-2 text-sm text-neon">{message}</p>}
      </section>

      <form className="card space-y-2 p-4" onSubmit={(e) => submit(e, "/api/captains")}>
        <h3 className="font-semibold">Add Captain</h3>
        <input required name="name" placeholder="Captain name" className="w-full rounded-lg bg-white/5 p-2" />
        <input required name="tag" placeholder="Tag (e.g. RVN)" className="w-full rounded-lg bg-white/5 p-2" />
        <input required name="region" placeholder="Region" className="w-full rounded-lg bg-white/5 p-2" />
        <button className="rounded-lg bg-accent px-3 py-2 text-sm">Save Captain</button>
      </form>

      <form className="card space-y-2 p-4" onSubmit={(e) => submit(e, "/api/players")}>
        <h3 className="font-semibold">Add Auction Player</h3>
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

      <form className="card space-y-2 p-4" onSubmit={(e) => submit(e, "/api/teams")}>
        <h3 className="font-semibold">Add Team (Optional manual)</h3>
        <input required name="name" placeholder="Team name" className="w-full rounded-lg bg-white/5 p-2" />
        <input required name="captainId" placeholder="Captain ID" className="w-full rounded-lg bg-white/5 p-2" />
        <button className="rounded-lg bg-accent px-3 py-2 text-sm">Save Team</button>
      </form>

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
    </section>
  );
}
