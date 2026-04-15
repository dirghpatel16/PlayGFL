"use client";

import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchJSON } from "@/lib/services/http";

interface DashboardPayload {
  profile: { completion_percent: number; approved: boolean };
  emailVerified: boolean;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    fetchJSON<DashboardPayload>("/api/profile")
      .then(setData)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
  }, []);

  const logout = async () => {
    await fetchJSON("/api/auth/logout", { method: "POST" });
    location.href = "/auth/login";
  };

  if (error) {
    return (
      <div className="py-10">
        <div className="card p-6">
          <p>{error}</p>
          <Link href="/auth/login" className="mt-4 inline-block rounded-lg bg-accent px-3 py-2">Go to Login</Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="py-10"><div className="card p-6">Loading dashboard...</div></div>;
  }


  const profileComplete = (data.profile.completion_percent ?? 0) >= 70;
  const trialRegistered = profileComplete && data.emailVerified;
  const auctionEligible = trialRegistered && data.profile.approved;

  return (
    <div className="py-8 space-y-4">
      <section className="card p-5">
        <h1 className="text-2xl font-bold">Player Dashboard</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
          <span className={`rounded-full px-3 py-1 ${data.emailVerified ? "bg-neon/15 text-neon" : "bg-danger/20 text-danger"}`}>{data.emailVerified ? "Email Verified" : "Email Not Verified"}</span>
          <span className={`rounded-full px-3 py-1 ${profileComplete ? "bg-neon/15 text-neon" : "bg-white/10 text-white/70"}`}>{profileComplete ? "Profile Complete" : "Profile Incomplete"}</span>
          <span className={`rounded-full px-3 py-1 ${trialRegistered ? "bg-neon/15 text-neon" : "bg-white/10 text-white/70"}`}>{trialRegistered ? "Trial Registered" : "Trial Pending"}</span>
          <span className={`rounded-full px-3 py-1 ${data.profile.approved ? "bg-neon/15 text-neon" : "bg-white/10 text-white/70"}`}>{data.profile.approved ? "Approved" : "Pending Approval"}</span>
          <span className={`rounded-full px-3 py-1 ${auctionEligible ? "bg-neon/15 text-neon" : "bg-white/10 text-white/70"}`}>{auctionEligible ? "Auction Eligible" : "Auction Locked"}</span>
        </div>
        <p className="mt-3 text-sm text-white/70">Onboarding flow: Create account → Verify email → Complete profile → Register for trials → Get approved for scouting and auction eligibility.</p>
        <button className="mt-4 rounded-lg border border-white/20 px-3 py-2 text-sm" onClick={logout}>Logout</button>
      </section>
      <ProfileEditor />
    </div>
  );
}
