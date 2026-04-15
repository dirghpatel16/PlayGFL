"use client";

import { FormEvent, useState } from "react";
import { saveMockUser } from "@/lib/services/auth";
import { useRouter } from "next/navigation";

interface Props {
  mode: "login" | "signup" | "forgot";
}

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === "forgot") {
      setMessage("Password reset email sent (mock). Check your inbox.");
      return;
    }

    if (mode === "signup") {
      saveMockUser({
        id: crypto.randomUUID(),
        username,
        email,
        emailVerified: false,
        role: "player",
        createdAt: new Date().toISOString()
      });
      setMessage("Account created. Verification email sent (mock). Please verify before entering dashboard.");
      return;
    }

    saveMockUser({
      id: "demo-user",
      username: username || "DemoPlayer",
      email,
      emailVerified: true,
      role: "player",
      createdAt: new Date().toISOString()
    });
    router.push("/dashboard");
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
      <button className="w-full rounded-xl bg-accent p-3 font-semibold" type="submit">Continue</button>
      {message && <p className="text-sm text-neon">{message}</p>}
    </form>
  );
}
