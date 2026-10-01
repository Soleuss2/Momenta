"use client";

import { ShieldCheck, Lock, EyeOff, UserX, Database, Heart, Mail } from "lucide-react";
import { SiteFooter } from "../../components/site-footer";
import { SiteNav } from "../../components/site-nav";
import { useTheme } from "../theme-provider";

export default function PrivacyPolicyPage() {
  const { isNight } = useTheme();

  return (
    <main className={`marketing-shell ${isNight ? "is-night" : ""}`}>
      <SiteNav variant="public" />

      <section className="hero-grid min-h-0 pt-16 pb-8">
        <div className="hero-copy max-w-3xl">
          <p className="eyebrow">
            <ShieldCheck size={15} /> Privacy Policy
          </p>
          <h1 className="mt-4 font-title text-4xl text-rose-950 sm:text-6xl">
            Your memories belong to <em>you.</em>
          </h1>
          <p className="mt-5 text-base leading-7 text-rose-950/70 sm:text-lg">
            Momenta was built from the ground up to be a quiet, private sanctuary for two people. We believe intimate memories should never be tracked, mined, or sold.
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-rose-900/40">
            Last updated: October 2026
          </p>
        </div>
      </section>

      <div className="mx-auto w-[min(1180px,calc(100%-3rem))] pb-24">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="rounded-2xl border border-rose-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 text-rose-600 mb-4">
              <EyeOff size={20} />
            </span>
            <h3 className="font-title text-xl text-rose-950">Zero Public Feeds</h3>
            <p className="mt-2 text-sm leading-6 text-rose-900/70">
              There are no public profiles, follower counts, or public algorithms. Only you and your chosen partner can see your shared journal.
            </p>
          </div>

          <div className="rounded-2xl border border-rose-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 text-rose-600 mb-4">
              <Lock size={20} />
            </span>
            <h3 className="font-title text-xl text-rose-950">Encrypted & Isolated</h3>
            <p className="mt-2 text-sm leading-6 text-rose-900/70">
              Every row and memory in our database is protected by Supabase Row Level Security (RLS) and encrypted in transit and at rest.
            </p>
          </div>

          <div className="rounded-2xl border border-rose-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 text-rose-600 mb-4">
              <UserX size={20} />
            </span>
            <h3 className="font-title text-xl text-rose-950">No Third-Party Ads</h3>
            <p className="mt-2 text-sm leading-6 text-rose-900/70">
              We do not sell personal data, display advertising, or share your stories with data brokers.
            </p>
          </div>
        </div>

        <div className="mt-14 space-y-12 rounded-3xl border border-rose-200/80 bg-white/60 p-8 sm:p-12 text-rose-950 shadow-sm backdrop-blur-sm">
          <section>
            <h2 className="font-title text-2xl text-rose-950">1. Information We Collect</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-rose-950/75">
              <p>
                <strong>Account Credentials:</strong> When creating an account, we collect your email address and optional display name. Password hashes are managed securely via Supabase Auth and are never accessible to us in plain text.
              </p>
              <p>
                <strong>Journal Content:</strong> Content you choose to record, including journal notes, thoughts, milestones, dates, photo uploads, and video links.
              </p>
              <p>
                <strong>Essential Technical Data:</strong> Authentication session tokens and rate-limiting counters to secure our servers against automated abuse.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-title text-2xl text-rose-950">2. How Your Data Is Stored & Guarded</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-rose-950/75">
              <p>
                Data is hosted on enterprise-grade cloud infrastructure with TLS 1.3 encryption in transit and AES-256 encryption at rest.
              </p>
              <p>
                <strong>Row Level Security (RLS):</strong> Our database policies strictly isolate your data. Queries are tied directly to authenticated user IDs so no other user can query or view your shared moments.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-title text-2xl text-rose-950">3. Your Rights & Data Portability</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-rose-950/75">
              <p>
                You retain complete ownership of all content you upload. You have the right to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Access and view all memories saved in your journal at any time.</li>
                <li>Edit or permanently delete individual memories, reflections, or notes.</li>
                <li>Request complete account deletion, which permanently purges your stored records and associated files.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-title text-2xl text-rose-950">4. Contact & Privacy Inquiries</h2>
            <p className="mt-4 text-sm leading-7 text-rose-950/75">
              If you have any questions or concerns about your data or this policy, please reach out to us at{" "}
              <a href="mailto:privacy@momenta.app" className="font-semibold text-rose-700 underline decoration-rose-300">
                privacy@momenta.app
              </a>.
            </p>
          </section>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
