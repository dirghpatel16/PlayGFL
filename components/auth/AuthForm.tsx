"use client";

import { FormEvent, useState } from "react";
import { saveMockUser } from "@/lib/services/auth";
import { fetchJSON } from "@/lib/services/http";
import { User } from "@/lib/types/models";
import { useRouter } from "next/navigation";

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
        await fetchJSON<User>("/api/auth/signup", {
          method: "POST",
          body: JSON.stringify({ username, email, password })
        });
        setMessage("Account created. Verification email queued. Login to continue.");
        return;
      }

      const user = await fetchJSON<User>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      saveMockUser(user);
      router.push("/dashboard");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-bold">{mode === "login" ? "Login" : mode === "signup" ? "Create Account" : "Reset Password"}</h1>
      {mode === "signup" && (
        <input className="w-full rounded-xl bg-white/5 p-3" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      )}
      <input className="w-full rounded-xl bg-white/5 p-3" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      {mode !== "forgot" && (
        <input className="w-full rounded-xl bg-white/5 p-3" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      )}
      <button className="w-full rounded-xl bg-accent p-3 font-semibold disabled:opacity-60" type="submit" disabled={loading}>
        {loading ? "Please wait..." : "Continue"}
      </button>
      {message && <p className="text-sm text-neon">{message}</p>}
    </form>
  );
}
