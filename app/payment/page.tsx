"use client";

import { FormEvent, useEffect, useState } from "react";
import { fetchJSON } from "@/lib/services/http";
import { seasonConfig } from "@/lib/config/season";

interface PaymentPayload {
  status: "unpaid" | "submitted" | "confirmed";
  label?: string;
}

export default function PaymentPage() {
  const [payment, setPayment] = useState<PaymentPayload>({ status: "unpaid", label: "Unpaid" });
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = () => fetchJSON<{ payment: PaymentPayload }>("/api/payment").then((d) => setPayment(d.payment ?? { status: "unpaid", label: "Unpaid" })).catch(() => null);

  useEffect(() => { load(); }, []);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetchJSON("/api/payment", {
      method: "POST",
      body: JSON.stringify({
        payerName: fd.get("payerName"),
        utr: fd.get("utr"),
        screenshotName: (fd.get("screenshot") as File)?.name || undefined
      })
    });
    setMessage("Payment Submitted. We will verify shortly.");
    e.currentTarget.reset();
    setShowForm(false);
    load();
  };

  return (
    <div className="py-8 space-y-5">
      <h1 className="section-title">PlayGFL Season 2 Entry Payment</h1>

      <section className="card p-5 grid gap-5 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Scan & Pay</p>
          <p className="mt-2 text-sm text-white/75">Entry fee is <strong>₹{seasonConfig.entryFee}</strong>.</p>
          <img src={process.env.NEXT_PUBLIC_PAYMENT_QR_URL || "https://dummyimage.com/600x600/111/00ffe0&text=PlayGFL+Season+2+QR"} alt="PlayGFL Season 2 payment QR code" className="mt-4 w-full max-w-sm rounded-xl border border-white/20" />
          {process.env.NEXT_PUBLIC_UPI_ID && <p className="mt-3 text-sm text-white/80">UPI ID: <strong>{process.env.NEXT_PUBLIC_UPI_ID}</strong></p>}
          <ol className="mt-3 space-y-1 text-xs text-white/65">
            <li>1) Open any UPI app and scan the QR code.</li>
            <li>2) Pay exactly ₹{seasonConfig.entryFee}.</li>
            <li>3) Tap <strong>I Have Paid</strong> and submit payer name + UTR.</li>
          </ol>
          <button className="cta-primary mt-4" onClick={() => setShowForm((v) => !v)}>{showForm ? "Hide Form" : "I Have Paid"}</button>
        </div>

        <div className="space-y-3">
          <p className="text-sm">Current Status: <span className="font-semibold">{payment.label ?? "Unpaid"}</span></p>
          {showForm && (
            <form onSubmit={submit} className="space-y-3 border border-white/10 p-3 rounded-xl">
              <input required name="payerName" placeholder="Payer Name" className="w-full rounded bg-white/5 p-3" />
              <input required name="utr" placeholder="UTR / Transaction Reference" className="w-full rounded bg-white/5 p-3" />
              <input name="screenshot" type="file" accept="image/*" className="w-full rounded bg-white/5 p-3" />
              <button className="cta-primary w-full">Submit Payment</button>
            </form>
          )}
          {message && <p className="text-sm text-neon">{message}</p>}
        </div>
      </section>
    </div>
  );
}
