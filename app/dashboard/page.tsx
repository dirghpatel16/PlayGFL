"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchJSON } from "@/lib/services/http";

interface DashboardPayload {
  paymentStatus: "unpaid" | "submitted" | "confirmed";
  paymentLabel?: string;
  registrationStatus: "Not Registered" | "Registered for GFL Season 2";
  entryFee: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJSON<DashboardPayload>("/api/profile").then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="py-10"><div className="card p-6">{error}</div></div>;
  if (!data) return <div className="py-10"><div className="card p-6">Loading dashboard...</div></div>;

  return (
    <div className="py-8">
      <section className="card p-5 space-y-4">
        <h1 className="text-2xl font-bold">My GFL Season 2 Status</h1>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border border-white/15 bg-white/[0.02] p-4 text-sm">
            <p><strong>Entry Fee:</strong> ₹{data.entryFee}</p>
            <p><strong>Payment Status:</strong> {data.paymentLabel ?? "Unpaid"}</p>
            <p><strong>Registration Status:</strong> {data.registrationStatus}</p>
          </div>
          <div className="border border-white/15 bg-white/[0.02] p-4 text-sm">
            <p>Pay ₹{data.entryFee} using QR, submit UTR, then wait for confirmation.</p>
            {data.paymentStatus === "unpaid" && <Link href="/payment" className="cta-primary mt-3">Go to Payment Page</Link>}
            {data.paymentStatus === "submitted" && <p className="mt-3 text-neon">Payment Submitted. Verification pending.</p>}
            {data.paymentStatus === "confirmed" && <p className="mt-3 text-neon">Payment Confirmed. You are registered for GFL Season 2.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
