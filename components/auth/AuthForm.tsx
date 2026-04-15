"use client";

import { FormEvent, useMemo, useState } from "react";
import { fetchJSON } from "@/lib/services/http";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  mode: "login" | "signup" | "forgot";
}

interface ForgotResponse {
  ok: boolean;
  message: string;
}

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const maskedEmail = useMemo(() => {
    if (!email.includes("@")) return email;
    const [name, domain] = email.split("@");
    const head = name.slice(0, 2);
    return `${head}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
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
      setMessage("Verification email resent. Please check your inbox.");
      startCooldown();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to resend verification email.");
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
        const res = await fetchJSON<ForgotResponse>("/api/auth/forgot", {
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
        setSignupSuccess(true);
        setMessage("We’ve sent a verification link to your email. Please verify your account to continue.");
        startCooldown();
        return;
      }

      const login = await fetchJSON<{ emailVerified: boolean }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      if (!login.emailVerified) {
        setMessage("Account login successful, but your email is not verified yet. Please verify to unlock league actions.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to process request");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "signup" && signupSuccess) {
    return (
      <section className="card mx-auto max-w-md space-y-4 p-6">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-sm text-white/80">We’ve sent a verification link to <span className="font-semibold text-neon">{maskedEmail}</span>. Please verify your account to continue.</p>
        <div className="space-y-2">
          <a href="https://mail.google.com" target="_blank" rel="noreferrer" className="cta-primary w-full">Open Gmail</a>
          <button type="button" onClick={resend} disabled={loading || resendCooldown > 0} className="cta-ghost w-full disabled:opacity-60">
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Verification Email"}
          </button>
          <Link href="/auth/login" className="block text-center text-sm text-white/70 underline hover:text-white">Back to Login</Link>
        </div>
        {message && <p className="text-sm text-neon">{message}</p>}
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-bold">{mode === "login" ? "Welcome back" : mode === "signup" ? "Create your PlayGFL account" : "Reset Password"}</h1>
      <p className="text-sm text-white/70">{mode === "signup" ? "Join the official PlayGFL competitive ecosystem." : mode === "login" ? "Login to manage profile, trials, and auction eligibility." : "We’ll send a reset link to your inbox."}</p>
      {mode === "signup" && (
        <input className="w-full rounded-xl bg-white/5 p-3" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      )}
      <input className="w-full rounded-xl bg-white/5 p-3" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      {mode !== "forgot" && (
        <input className="w-full rounded-xl bg-white/5 p-3" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      )}
      <button className="w-full rounded-xl bg-accent p-3 font-semibold disabled:opacity-60" type="submit" disabled={loading}>
        {loading ? (mode === "signup" ? "Creating account..." : "Please wait...") : "Continue"}
      </button>
      {message && <p className="text-sm text-neon">{message}</p>}
    </form>
  );
}
