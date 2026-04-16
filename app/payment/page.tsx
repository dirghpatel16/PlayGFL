"use client";

import { FormEvent, useEffect, useState } from "react";
import { fetchJSON } from "@/lib/services/http";
import { seasonConfig } from "@/lib/config/season";

interface PaymentPayload {
  status: "unpaid" | "submitted" | "verified";
  utr?: string;
  payer_name?: string;
  payerName?: string;
}

export default function PaymentPage() {
  const [payment, setPayment] = useState<PaymentPayload>({ status: "unpaid" });
  const [message, setMessage] = useState("");

  const load = () => fetchJSON<{ payment: PaymentPayload }>("/api/payment").then((d) => setPayment(d.payment ?? { status: "unpaid" })).catch(() => null);

  useEffect(() => { load(); }, []);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetchJSON("/api/payment", {
      method: "POST",
      body: JSON.stringify({
        utr: fd.get("utr"),
        payerName: fd.get("payerName"),
        screenshotName: (fd.get("screenshot") as File)?.name || undefined
      })
    });
    setMessage("Payment submitted. Awaiting verification.");
    e.currentTarget.reset();
    load();
  };

  return (
    <div className="py-8 space-y-5">
      <h1 className="section-title">Entry Fee Payment</h1>
      <section className="card p-5 grid gap-5 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Scan and Pay</p>
          <p className="mt-2 text-sm text-white/75">Entry fee for PlayGFL Season 2: <strong>₹{seasonConfig.entryFee}</strong></p>
          <img src={process.env.NEXT_PUBLIC_PAYMENT_QR_URL || "https://dummyimage.com/480x480/111/00ffe0&text=PlayGFL+QR+Code"} alt="PlayGFL entry fee QR code" className="mt-4 w-full max-w-xs rounded border border-white/20" />
          <p className="mt-3 text-xs text-white/60">Payment Help: scan QR in any UPI app, pay ₹{seasonConfig.entryFee}, then submit UTR below.</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input required name="utr" placeholder="UTR / Transaction Reference" className="w-full rounded bg-white/5 p-3" />
          <input required name="payerName" placeholder="Payer Name" className="w-full rounded bg-white/5 p-3" />
          <input name="screenshot" type="file" accept="image/*" className="w-full rounded bg-white/5 p-3" />
          <button className="cta-primary w-full">Submit Payment</button>
          {message && <p className="text-sm text-neon">{message}</p>}
        </form>
      </section>
      <section className="card p-4">
        <p className="text-sm">Status: <span className="font-semibold uppercase">{payment.status}</span></p>
      </section>
    </div>
  );
}
