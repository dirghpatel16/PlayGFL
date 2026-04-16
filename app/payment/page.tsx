"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { fetchJSON } from "@/lib/services/http";
import { seasonConfig } from "@/lib/config/season";

interface PaymentPayload {
  status: "unpaid" | "submitted" | "confirmed" | "rejected";
  label?: string;
  utr?: string;
  updatedAt?: string;
}

export default function PaymentPage() {
  const [payment, setPayment] = useState<PaymentPayload>({ status: "unpaid", label: "Unpaid" });
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = () =>
    fetchJSON<{ payment: PaymentPayload }>("/api/payment")
      .then((d) => setPayment(d.payment ?? { status: "unpaid", label: "Unpaid" }))
      .catch(() => null);

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    const fd = new FormData(e.currentTarget);
    const screenshot = fd.get("screenshot") as File;
    if (!screenshot || !screenshot.name) {
      setMessage("Screenshot proof is required.");
      return;
    }

    setSubmitting(true);
    try {
      const screenshotDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = reject;
        reader.readAsDataURL(screenshot);
      });

      await fetchJSON("/api/payment", {
        method: "POST",
        body: JSON.stringify({
          payerName: fd.get("payerName"),
          utr: fd.get("utr"),
          screenshotName: screenshot.name,
          screenshotDataUrl
        })
      });

      setMessage("Payment submitted for verification. Your registration will be confirmed after payment verification.");
      e.currentTarget.reset();
      setShowForm(false);
      load();
    } catch (error: any) {
      setMessage(error?.message || "Unable to submit payment right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-8 space-y-5">
      <h1 className="section-title">GFL Season 2 Entry Payment</h1>

      <section className="card p-5 grid gap-5 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Scan & Pay</p>
          <p className="mt-2 text-sm text-white/75">Entry fee is <strong>₹{seasonConfig.entryFee}</strong>.</p>
          <div className="mt-4 relative w-full max-w-sm aspect-square rounded-xl overflow-hidden border border-white/20">
            <Image
              src={process.env.NEXT_PUBLIC_PAYMENT_QR_URL || "/payment-qr.jpeg"}
              alt="GFL Season 2 payment QR code"
              fill
              sizes="(max-width: 640px) 90vw, 384px"
              className="object-contain"
              priority
            />
          </div>
          {process.env.NEXT_PUBLIC_UPI_ID && <p className="mt-3 text-sm text-white/80">UPI ID: <strong>{process.env.NEXT_PUBLIC_UPI_ID}</strong></p>}
          <ol className="mt-3 space-y-1 text-xs text-white/65">
            <li>1) Open any UPI app and scan the QR code.</li>
            <li>2) Pay exactly ₹{seasonConfig.entryFee}.</li>
            <li>3) Submit payer name + UTR + screenshot proof.</li>
            <li>4) Wait for commissioner verification.</li>
          </ol>
          <button className="cta-primary mt-4" onClick={() => setShowForm((v) => !v)}>{showForm ? "Hide Form" : "Submit Payment Proof"}</button>
        </div>

        <div className="space-y-3">
          <p className="text-sm">Current Status: <span className="font-semibold">{payment.label ?? "Unpaid"}</span></p>
          <p className="text-xs text-white/65">Awaiting Verification: manual QR submissions are reviewed by commissioner staff.</p>
          {showForm && (
            <form onSubmit={submit} className="space-y-3 border border-white/10 p-3 rounded-xl">
              <input required name="payerName" placeholder="Payer Name" className="w-full rounded bg-white/5 p-3" />
              <input required name="utr" placeholder="UTR / Transaction Reference" className="w-full rounded bg-white/5 p-3" />
              <input required name="screenshot" type="file" accept="image/*" className="w-full rounded bg-white/5 p-3" />
              <button disabled={submitting} className="cta-primary w-full disabled:opacity-60">{submitting ? "Submitting..." : "Submit Payment"}</button>
            </form>
          )}
          {message && <p className="text-sm text-neon">{message}</p>}
        </div>
      </section>
    </div>
  );
}
