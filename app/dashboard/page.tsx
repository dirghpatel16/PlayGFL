"use client";

import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { getMockUser } from "@/lib/services/auth";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [user, setUser] = useState<ReturnType<typeof getMockUser>>(null);

  useEffect(() => setUser(getMockUser()), []);

  if (!user) {
    return (
      <div className="py-10">
        <div className="card p-6">
          <p>Please login to view dashboard.</p>
          <Link href="/auth/login" className="mt-4 inline-block rounded-lg bg-accent px-3 py-2">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-4">
      <section className="card p-5">
        <h1 className="text-2xl font-bold">Welcome, {user.username}</h1>
        {!user.emailVerified && <p className="mt-2 text-sm text-danger">Verify email to unlock league actions.</p>}
        <p className="mt-2 text-sm text-white/70">Profile completion: 55% (mock). Finish setup to appear in scouting and auction rankings.</p>
      </section>
      <ProfileEditor />
    </div>
  );
}
