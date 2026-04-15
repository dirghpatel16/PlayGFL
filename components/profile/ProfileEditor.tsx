"use client";

import { useState } from "react";

const roles = ["Assaulter", "Support", "IGL", "Sniper", "Flexible"];

export function ProfileEditor() {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <section className="card p-5">
      <h2 className="text-xl font-bold">Complete Your Player Profile</h2>
      <div className="mt-4 grid gap-3">
        <input className="rounded-xl bg-white/5 p-3" placeholder="BGMI In-game Name" />
        <input className="rounded-xl bg-white/5 p-3" placeholder="BGMI ID" />
        <input className="rounded-xl bg-white/5 p-3" placeholder="Region / State" />
        <textarea className="rounded-xl bg-white/5 p-3" rows={3} placeholder="Short bio" />
        <div>
          <p className="mb-2 text-sm text-white/70">Role Preferences</p>
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelected((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))}
                className={`rounded-full px-3 py-2 text-xs ${selected.includes(role) ? "bg-accent" : "bg-white/10"}`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
