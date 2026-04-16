"use client";

import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/services/http";

const roles = ["Assaulter", "Support", "IGL", "Sniper", "Flexible"];

interface ProfilePayload {
  bgmi_name?: string | null;
  bgmi_id?: string | null;
  preferred_roles?: string[];
  completion_percent?: number;
}

export function ProfileEditor() {
  const [profile, setProfile] = useState<ProfilePayload>({ preferred_roles: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchJSON<{ profile: ProfilePayload }>("/api/profile")
      .then((d) => setProfile({ preferred_roles: [], ...d.profile }))
      .catch((err) => setMessage(err.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setMessage("");
    try {
      const data = await fetchJSON<{ profile: ProfilePayload }>("/api/profile", {
        method: "PUT",
        body: JSON.stringify(profile)
      });
      setProfile(data.profile);
      setMessage("Player identity saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to save profile");
    }
  };

  if (loading) return <section className="card p-5">Loading profile...</section>;

  return (
    <section className="card p-5">
      <h2 className="text-xl font-bold">Complete Player Identity</h2>
      <p className="mt-1 text-sm text-white/70">Required for Season 2 trials: BGMI IGN, BGMI ID, and role preference.</p>
      <div className="mt-4 grid gap-3">
        <input className="rounded-xl bg-white/5 p-3" placeholder="BGMI IGN" value={profile.bgmi_name ?? ""} onChange={(e) => setProfile((p) => ({ ...p, bgmi_name: e.target.value }))} />
        <input className="rounded-xl bg-white/5 p-3" placeholder="BGMI ID" value={profile.bgmi_id ?? ""} onChange={(e) => setProfile((p) => ({ ...p, bgmi_id: e.target.value }))} />
        <div>
          <p className="mb-2 text-sm text-white/70">Role Preference</p>
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <button key={role} type="button" onClick={() => setProfile((prev) => ({ ...prev, preferred_roles: [role] }))} className={`rounded-full px-3 py-2 text-xs ${(profile.preferred_roles ?? []).includes(role) ? "bg-accent" : "bg-white/10"}`}>
                {role}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <button className="cta-primary" type="button" onClick={save}>Save Profile</button>
          <p className="text-sm text-white/70">Completion: {profile.completion_percent ?? 0}%</p>
        </div>
        {message && <p className="text-sm text-neon">{message}</p>}
      </div>
    </section>
  );
}
