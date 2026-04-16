"use client";

import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchJSON } from "@/lib/services/http";

interface DashboardPayload {
  user: { username?: string; email?: string };
  profile: { completion_percent: number; trial_registered?: boolean; bgmi_name?: string; bgmi_id?: string; preferred_roles?: string[] };
  emailVerified: boolean;
  paymentStatus: "unpaid" | "submitted" | "verified";
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => fetchJSON<DashboardPayload>("/api/profile").then(setData).catch((err) => setError(err.message));

  useEffect(() => { load(); }, []);

  if (error) return <div className="py-10"><div className="card p-6"><p>{error}</p><Link href="/auth/login" className="mt-4 inline-block rounded-lg bg-accent px-3 py-2">Go to Login</Link></div></div>;
  if (!data) return <div className="py-10"><div className="card p-6">Loading dashboard...</div></div>;

  const registrationReady = data.emailVerified && (data.profile.completion_percent ?? 0) >= 100 && data.paymentStatus === "verified";

  return (
    <div className="py-8 space-y-4">
      <section className="card p-5">
        <h1 className="text-2xl font-bold">My PlayGFL Season 2 Status</h1>
        <div className="mt-3 inline-flex rounded-full bg-neon/15 px-3 py-1 text-xs uppercase tracking-[0.14em] text-neon">My Status: {registrationReady ? "Registered for Trials" : "Pending"}</div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="border border-white/15 bg-white/[0.02] p-4 text-sm">
            <p><strong>Username:</strong> {data.user?.username ?? "-"}</p>
            <p><strong>BGMI IGN:</strong> {data.profile.bgmi_name || "-"}</p>
            <p><strong>BGMI ID:</strong> {data.profile.bgmi_id || "-"}</p>
            <p><strong>Role Preference:</strong> {data.profile.preferred_roles?.[0] || "-"}</p>
            <p><strong>Registration Status:</strong> {data.profile.trial_registered ? "Registered" : "Not registered"}</p>
            <p><strong>Payment Status:</strong> {data.paymentStatus}</p>
          </div>
          <div className="border border-white/15 bg-white/[0.02] p-4 text-sm">
            <p>Step 1: Verify identity ({data.emailVerified ? "Done" : "Pending"})</p>
            <p>Step 2: Complete profile ({data.profile.completion_percent}%)</p>
            <p>Step 3: Pay entry fee ({data.paymentStatus})</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link className="cta-ghost" href="/payment">Pay Entry Fee</Link>
              <button className="cta-primary" onClick={async () => { await fetchJSON("/api/profile/trial", { method: "POST" }); load(); }} disabled={!registrationReady || !!data.profile.trial_registered}>{data.profile.trial_registered ? "Trials Registered" : "Register for Trials"}</button>
            </div>
          </div>
        </div>
      </section>
      <ProfileEditor />
    </div>
  );
}
