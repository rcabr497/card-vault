"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export function SignupForm({ callbackUrl = "/dashboard" }: { callbackUrl?: string }) {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isSignup) {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Something went wrong.");
          setSubmitting(false);
          return;
        }
      }

      const result = await signIn("credentials", { email, password, remember: String(remember), redirect: false });
      if (result?.error) {
        setError("Incorrect email or password.");
        setSubmitting(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-grid">
      <div className="auth-hero">
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--bg)" }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: "color-mix(in srgb, var(--bg) 20%, transparent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <span style={{ width: 13, height: 17, borderRadius: 3, background: "var(--bg)" }} />
          </span>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 19 }}>
            Card Vault
          </span>
        </Link>
        <div style={{ marginTop: "auto" }}>
          <h1 style={{ fontWeight: 800, fontSize: 42, lineHeight: 1.12, margin: "0 0 20px", maxWidth: "12ch" }}>
            Every card. Accounted for.
          </h1>
          <p style={{ fontSize: 15, maxWidth: "34ch", opacity: 0.92, margin: "0 0 32px" }}>
            Join collectors tracking their binders, decks, and values in one place.
          </p>
          <div
            style={{
              display: "flex",
              gap: 32,
              borderTop: "1px solid color-mix(in srgb, var(--bg) 30%, transparent)",
              paddingTop: 20,
            }}
          >
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 22 }}>1,204</div>
              <div style={{ fontSize: 11, opacity: 0.9 }}>avg. cards logged</div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 22 }}>$18k</div>
              <div style={{ fontSize: 11, opacity: 0.9 }}>avg. tracked value</div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div style={{ width: "100%", maxWidth: 360 }}>
          <div className="auth-toggle">
            <button type="button" className={isSignup ? "active" : ""} onClick={() => setIsSignup(true)}>
              Sign Up
            </button>
            <button type="button" className={!isSignup ? "active" : ""} onClick={() => setIsSignup(false)}>
              Log In
            </button>
          </div>

          <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 26, margin: "0 0 8px" }}>
            {isSignup ? "Create your vault" : "Welcome back"}
          </h2>
          <p style={{ fontSize: 13.5, color: "var(--text-soft)", margin: "0 0 28px" }}>
            {isSignup ? "Start tracking your collection in minutes." : "Log in to see what's new in your binders."}
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {error && <div className="form-error">{error}</div>}
            {isSignup && (
              <div className="field">
                <label>Name</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Ash Ketchum"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="field">
              <label>Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={isSignup ? 8 : undefined}
                required
              />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-soft)", cursor: "pointer" }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember me
            </label>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting} style={{ marginTop: 8 }}>
              {submitting ? "…" : isSignup ? "Sign Up" : "Log In"}
            </button>
          </form>

          <p style={{ fontSize: 12, color: "var(--text-soft)", marginTop: 24 }}>
            By continuing you agree to Card Vault&apos;s terms and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
