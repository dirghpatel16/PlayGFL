"use client";

import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/services/http";

const roles = ["Assaulter", "Support", "IGL", "Sniper", "Flexible"];

interface ProfilePayload {
  username?: string | null;
  bgmi_ign?: string | null;
  bgmi_id?: string | null;
  role_preference?: string | null;
  completion_percent?: number;
}

export function ProfileEditor() {
  const [profile, setProfile] = useState<ProfilePayload>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchJSON<{ profile: ProfilePayload }>("/api/profile")
      .then((d) => setProfile({ ...d.profile }))
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
      setMessage("Profile saved. Continue to payment.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to save profile");
    }
  };

  if (loading) return <section className="card p-5">Loading profile...</section>;

  return (
    <section className="card p-5">
      <h2 className="text-xl font-bold">Complete Minimal Player Profile</h2>
      <p className="mt-1 text-sm text-white/70">Only required fields: username, BGMI IGN, BGMI ID, role preference.</p>
      <div className="mt-4 grid gap-3">
        <input className="rounded-xl bg-white/5 p-3" placeholder="Username" value={profile.username ?? ""} onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))} />
        <input className="rounded-xl bg-white/5 p-3" placeholder="BGMI IGN" value={profile.bgmi_ign ?? ""} onChange={(e) => setProfile((p) => ({ ...p, bgmi_ign: e.target.value }))} />
        <input className="rounded-xl bg-white/5 p-3" placeholder="BGMI ID" value={profile.bgmi_id ?? ""} onChange={(e) => setProfile((p) => ({ ...p, bgmi_id: e.target.value }))} />
        <select className="rounded-xl bg-white/5 p-3" value={profile.role_preference ?? ""} onChange={(e) => setProfile((p) => ({ ...p, role_preference: e.target.value }))}>
          <option value="">Select role preference</option>
          {roles.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
        <div className="mt-2 flex items-center gap-3">
          <button className="cta-primary" type="button" onClick={save}>Save Profile</button>
          <p className="text-sm text-white/70">Completion: {profile.completion_percent ?? 0}%</p>
        </div>
        {message && <p className="text-sm text-neon">{message}</p>}
      </div>
    </section>
  );
}
