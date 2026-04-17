"use client";

import { FormEvent, useMemo, useState } from "react";
import { fetchJSON } from "@/lib/services/http";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  mode: "login" | "signup" | "forgot";
}

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const maskedEmail = useMemo(() => {
    if (!email.includes("@")) return email;
    const [name, domain] = email.split("@");
    return `${name.slice(0, 2)}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
  }, [email]);

  const startCooldown = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const resend = async () => {
    if (!email || resendCooldown > 0) return;
    setLoading(true);
    try {
      await fetchJSON("/api/auth/resend", { method: "POST", body: JSON.stringify({ email }) });
      setMessage("OTP resent to your email.");
      startCooldown();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      await fetchJSON("/api/auth/verify-otp", { method: "POST", body: JSON.stringify({ email, otp }) });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "forgot") {
        const res = await fetchJSON<{ message: string }>("/api/auth/forgot", {
          method: "POST",
          body: JSON.stringify({ email })
        });
        setMessage(res.message);
        return;
      }

      if (mode === "signup") {
        await fetchJSON("/api/auth/signup", {
          method: "POST",
          body: JSON.stringify({ username, email, password })
        });
        setShowOtpStep(true);
        setMessage("A 6-digit OTP has been sent to your email.");
        startCooldown();
        return;
      }

      await fetchJSON("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to process request");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "signup" && showOtpStep) {
    return (
      <section className="card mx-auto max-w-md space-y-4 p-6">
        <h1 className="text-2xl font-bold">Verify OTP</h1>
        <p className="text-sm text-white/80">Enter the 6-digit code sent to <span className="font-semibold text-neon">{maskedEmail}</span>.</p>
        <input className="w-full rounded-xl bg-white/5 p-3 text-center tracking-[0.4em]" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="------" />
        <button type="button" onClick={verifyOtp} className="cta-primary w-full" disabled={loading || otp.length !== 6}>{loading ? "Verifying..." : "Verify OTP"}</button>
        <button type="button" onClick={resend} disabled={loading || resendCooldown > 0} className="cta-ghost w-full disabled:opacity-60">{resendCooldown ? `Resend in ${resendCooldown}s` : "Resend OTP"}</button>
        <Link href="/auth/login" className="block text-center text-sm text-white/70 underline hover:text-white">Back to Login</Link>
        {message && <p className="text-sm text-neon">{message}</p>}
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-bold">{mode === "login" ? "Welcome back" : mode === "signup" ? "Create your GFL account" : "Reset Password"}</h1>
      <p className="text-sm text-white/70">{mode === "signup" ? "Fast signup with OTP verification." : mode === "login" ? "Login to manage profile and trials." : "We’ll send a reset OTP to your inbox."}</p>
      {mode === "signup" && <input className="w-full rounded-xl bg-white/5 p-3" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />}
      <input className="w-full rounded-xl bg-white/5 p-3" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      {mode !== "forgot" && <input className="w-full rounded-xl bg-white/5 p-3" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />}
      <button className="w-full rounded-xl bg-accent p-3 font-semibold disabled:opacity-60" type="submit" disabled={loading}>{loading ? (mode === "signup" ? "Sending OTP..." : "Please wait...") : "Continue"}</button>
      {message && <p className="text-sm text-neon">{message}</p>}
    </form>
  );
}
