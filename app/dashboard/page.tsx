"use client";

import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchJSON } from "@/lib/services/http";

interface DashboardPayload {
  profile: { completion_percent: number; trial_registered?: boolean; bgmi_name?: string; bgmi_id?: string; preferred_roles?: string[] };
  emailVerified: boolean;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = () => {
    fetchJSON<DashboardPayload>("/api/profile").then(setData).catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
  }, []);

  const logout = async () => {
    await fetchJSON("/api/auth/logout", { method: "POST" });
    location.href = "/auth/login";
  };

  const registerTrials = async () => {
    await fetchJSON("/api/profile/trial", { method: "POST" });
    setMessage("Trial registration submitted for Season 2.");
    load();
  };

  if (error) {
    return <div className="py-10"><div className="card p-6"><p>{error}</p><Link href="/auth/login" className="mt-4 inline-block rounded-lg bg-accent px-3 py-2">Go to Login</Link></div></div>;
  }

  if (!data) return <div className="py-10"><div className="card p-6">Loading dashboard...</div></div>;

  const profileComplete = (data.profile.completion_percent ?? 0) >= 100;
  const trialRegistered = Boolean(data.profile.trial_registered);

  return (
    <div className="py-8 space-y-4">
      <section className="card p-5">
        <h1 className="text-2xl font-bold">Your PlayGFL Player Hub</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
          <span className={`rounded-full px-3 py-1 ${data.emailVerified ? "bg-neon/15 text-neon" : "bg-danger/20 text-danger"}`}>{data.emailVerified ? "Verified" : "Not Verified"}</span>
          <span className={`rounded-full px-3 py-1 ${profileComplete ? "bg-neon/15 text-neon" : "bg-white/10 text-white/70"}`}>{profileComplete ? "Profile Complete" : "Profile Incomplete"}</span>
          <span className={`rounded-full px-3 py-1 ${trialRegistered ? "bg-neon/15 text-neon" : "bg-white/10 text-white/70"}`}>{trialRegistered ? "Trial Registered" : "Trial Pending"}</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="border border-white/15 bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-neon">Player Identity</p>
            <h3 className="mt-2 text-xl font-black uppercase">{data.profile.bgmi_name || "Set your IGN"}</h3>
            <p className="mt-1 text-sm text-white/70">BGMI ID: {data.profile.bgmi_id || "Pending"}</p>
            <p className="text-sm text-white/70">Role: {data.profile.preferred_roles?.[0] || "Not selected"}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.15em] text-white/60">Season Registration: {trialRegistered ? "Registered" : "Open"}</p>
          </div>
          <div className="border border-white/15 bg-white/[0.02] p-4">
            <p className="text-sm text-white/75">Flow: Create account → Verify OTP → Complete profile → Register for trials.</p>
            <button className="mt-4 cta-primary w-full" onClick={registerTrials} disabled={!data.emailVerified || !profileComplete || trialRegistered}>
              {trialRegistered ? "Trials Registered" : "Register for Trials"}
            </button>
          </div>
        </div>

        {message && <p className="mt-3 text-sm text-neon">{message}</p>}
        <button className="mt-4 rounded-lg border border-white/20 px-3 py-2 text-sm" onClick={logout}>Logout</button>
      </section>
      <ProfileEditor />
    </div>
  );
}
