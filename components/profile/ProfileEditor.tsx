"use client";

import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/services/http";

const roles = ["Assaulter", "Support", "IGL", "Sniper", "Flexible"];

interface ProfilePayload {
  avatar_url?: string | null;
  bgmi_name?: string | null;
  bgmi_id?: string | null;
  preferred_roles?: string[];
  bio?: string | null;
  region?: string | null;
  experience_level?: string | null;
  completion_percent?: number;
  approved?: boolean;
}

export function ProfileEditor() {
  const [profile, setProfile] = useState<ProfilePayload>({ preferred_roles: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    fetchJSON<{ profile: ProfilePayload }>("/api/profile")
      .then((d) => setProfile({ preferred_roles: [], ...d.profile }))
      .catch((err) => setMessage(err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleRole = (role: string) => {
    setProfile((prev) => {
      const selected = prev.preferred_roles ?? [];
      const next = selected.includes(role) ? selected.filter((r) => r !== role) : [...selected, role];
      return { ...prev, preferred_roles: next };
    });
  };

  const save = async () => {
    setMessage("");
    try {
      const data = await fetchJSON<{ profile: ProfilePayload }>("/api/profile", {
        method: "PUT",
        body: JSON.stringify(profile)
      });
      setProfile(data.profile);
      setMessage("Profile saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to save profile");
    }
  };

  if (loading) return <section className="card p-5">Loading profile...</section>;

  return (
    <section className="card p-5">
      <h2 className="text-xl font-bold">Complete Your Player Profile</h2>
      <div className="mt-4 grid gap-3">
        <input className="rounded-xl bg-white/5 p-3" placeholder="BGMI In-game Name" value={profile.bgmi_name ?? ""} onChange={(e) => setProfile((p) => ({ ...p, bgmi_name: e.target.value }))} />
        <input className="rounded-xl bg-white/5 p-3" placeholder="BGMI ID" value={profile.bgmi_id ?? ""} onChange={(e) => setProfile((p) => ({ ...p, bgmi_id: e.target.value }))} />
        <input className="rounded-xl bg-white/5 p-3" placeholder="Region / State" value={profile.region ?? ""} onChange={(e) => setProfile((p) => ({ ...p, region: e.target.value }))} />
        <input className="rounded-xl bg-white/5 p-3" placeholder="Experience Level" value={profile.experience_level ?? ""} onChange={(e) => setProfile((p) => ({ ...p, experience_level: e.target.value }))} />
        <textarea className="rounded-xl bg-white/5 p-3" rows={3} placeholder="Short bio" value={profile.bio ?? ""} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} />
        <div>
          <p className="mb-2 text-sm text-white/70">Role Preferences</p>
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={`rounded-full px-3 py-2 text-xs ${(profile.preferred_roles ?? []).includes(role) ? "bg-accent" : "bg-white/10"}`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <button className="cta-primary" type="button" onClick={save}>Save Profile</button>
          <p className="text-sm text-white/70">Completion: {profile.completion_percent ?? 0}%</p>
          <p className={`text-xs uppercase tracking-[0.12em] ${profile.approved ? "text-neon" : "text-white/60"}`}>{profile.approved ? "Approved" : "Pending Approval"}</p>
        </div>
        {message && <p className="text-sm text-neon">{message}</p>}
      </div>
    </section>
  );
}
