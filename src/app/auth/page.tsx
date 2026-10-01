"use client";

import { ArrowRight, Heart, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AmbientBackground } from "../../components/ambient-background";
import { SiteFooter } from "../../components/site-footer";
import { SiteNav } from "../../components/site-nav";
import { ScrollReveal } from "../../components/scroll-reveal";
import { useTheme } from "../theme-provider";
import { createClient } from "@/lib/supabase/client";

import { sanitizeEmail, sanitizePassword, sanitizeDisplayName } from "@/lib/sanitize";

type AuthMode = "sign-in" | "sign-up";

function AuthPanel({ mode, onModeChange }: { mode: AuthMode; onModeChange: (mode: AuthMode) => void }) {
  const isSignUp = mode === "sign-up";
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // 1. Sanitize & Validate Email
    const emailResult = sanitizeEmail(email);
    if (!emailResult.valid) {
      setError(emailResult.error ?? "Invalid email address");
      return;
    }

    // 2. Sanitize & Validate Password
    const passwordResult = sanitizePassword(password);
    if (!passwordResult.valid) {
      setError(passwordResult.error ?? "Invalid password");
      return;
    }

    // 3. Sanitize Display Name (for sign up)
    const cleanName = sanitizeDisplayName(name);

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: emailResult.value,
          password: passwordResult.value,
          options: {
            data: { display_name: cleanName || undefined },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) setError(error.message);
        else router.push("/auth/check-email");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailResult.value,
          password: passwordResult.value,
        });
        if (error) setError(error.message);
        else router.push("/users");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  }

  return (
    <section className="auth-panel" aria-labelledby="auth-title">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Your private corner</p>
          <h1 id="auth-title" className="mt-2 font-title text-4xl text-rose-950">
            {isSignUp ? "Start your story" : "Welcome back"}
          </h1>
        </div>
        <span className="auth-mark" aria-hidden="true">
          <Heart size={18} fill="currentColor" />
        </span>
      </div>

      <div className="auth-tabs" role="tablist" aria-label="Account access">
        <button type="button" role="tab" aria-selected={!isSignUp} onClick={() => onModeChange("sign-in")}>
          Sign in
        </button>
        <button type="button" role="tab" aria-selected={isSignUp} onClick={() => onModeChange("sign-up")}>
          Create account
        </button>
      </div>

      <form className="mt-7 space-y-4" onSubmit={handleEmailAuth}>
        {isSignUp ? (
          <label className="field-label">
            Your name
            <input
              type="text"
              placeholder="Alex & Jamie"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        ) : null}

        <label className="field-label">
          Email address
          <span className="field-input">
            <Mail size={17} aria-hidden="true" />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </span>
        </label>

        <label className="field-label">
          Password
          <span className="field-input">
            <LockKeyhole size={17} aria-hidden="true" />
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </span>
        </label>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="primary-button w-full" disabled={loading}>
          {loading ? "Please wait..." : isSignUp ? "Create your journal" : "Continue to your journal"}
          <ArrowRight size={17} />
        </button>
      </form>

      <div className="auth-divider">
        <span>or continue with</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="provider-button"
          onClick={() => handleOAuth("google")}
          disabled={loading}
        >
          <span className="provider-letter">G</span>Google
        </button>
        <button
          type="button"
          className="provider-button"
          onClick={() => handleOAuth("apple")}
          disabled={loading}
        >
          <span className="provider-letter provider-apple">●</span>Apple
        </button>
      </div>
    </section>
  );
}

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<AuthMode>("sign-up");
  const { isNight } = useTheme();

  return (
    <main className={`marketing-shell ${isNight ? "is-night" : ""}`}>
      <AmbientBackground />
      <SiteNav variant="auth" />
      <ScrollReveal className="auth-layout">
        <div className="auth-intro">
          <p className="eyebrow">A little space for what matters</p>
          <h2 className="mt-5 max-w-xl font-title text-5xl leading-[1.02] text-rose-950 sm:text-6xl">
            The best parts of life deserve a place to stay.
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-rose-950/65">
            Create a quiet, beautiful home for the stories you are still writing together.
          </p>
        </div>
        <AuthPanel mode={authMode} onModeChange={setAuthMode} />
      </ScrollReveal>
      <SiteFooter />
    </main>
  );
}
