"use client";

import { Cookie, CheckCircle, ShieldCheck } from "lucide-react";
import { SiteFooter } from "../../components/site-footer";
import { SiteNav } from "../../components/site-nav";
import { useTheme } from "../theme-provider";

export default function CookiePolicyPage() {
  const { isNight } = useTheme();

  return (
    <main className={`marketing-shell ${isNight ? "is-night" : ""}`}>
      <SiteNav variant="public" />

      <section className="hero-grid min-h-0 pt-16 pb-8">
        <div className="hero-copy max-w-3xl">
          <p className="eyebrow">
            <Cookie size={15} /> Cookie Policy
          </p>
          <h1 className="mt-4 font-title text-4xl text-rose-950 sm:text-6xl">
            Only what is <em>necessary.</em>
          </h1>
          <p className="mt-5 text-base leading-7 text-rose-950/70 sm:text-lg">
            Momenta uses only essential cookies and local storage tokens required for secure authentication and theme preferences. No advertising cookies, ever.
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-rose-900/40">
            Last updated: October 2026
          </p>
        </div>
      </section>

      <div className="mx-auto w-[min(1180px,calc(100%-3rem))] pb-24">
        <div className="space-y-12 rounded-3xl border border-rose-200/80 bg-white/60 p-8 sm:p-12 text-rose-950 shadow-sm backdrop-blur-sm">
          <section>
            <h2 className="font-title text-2xl text-rose-950">1. What Are Cookies?</h2>
            <p className="mt-4 text-sm leading-7 text-rose-950/75">
              Cookies are tiny text files saved on your device when you visit a website. They allow web applications to remember your session so you do not need to log in on every single page.
            </p>
          </section>

          <section>
            <h2 className="font-title text-2xl text-rose-950">2. Cookies We Use</h2>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-rose-200 text-xs uppercase tracking-wider text-rose-900/60 font-semibold">
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Provider</th>
                    <th className="pb-3 pr-4">Purpose</th>
                    <th className="pb-3">Type & Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100 text-rose-950/80">
                  <tr>
                    <td className="py-4 pr-4 font-mono text-xs font-semibold">sb-*-auth-token</td>
                    <td className="py-4 pr-4">Supabase</td>
                    <td className="py-4 pr-4">Secure authentication token that maintains your active login session.</td>
                    <td className="py-4 font-semibold text-rose-700">Strictly Necessary · Session</td>
                  </tr>
                  <tr>
                    <td className="py-4 pr-4 font-mono text-xs font-semibold">our-journal-theme</td>
                    <td className="py-4 pr-4">Momenta</td>
                    <td className="py-4 pr-4">Stores your light or night mode visual theme preference.</td>
                    <td className="py-4 font-semibold text-rose-700">Strictly Necessary · Local Storage</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-title text-2xl text-rose-950">3. Non-Essential & Tracking Cookies</h2>
            <p className="mt-4 text-sm leading-7 text-rose-950/75">
              Momenta <strong>does not use</strong> any third-party marketing, analytics, or behavioral tracking cookies (such as Google Analytics or Meta Pixel). Your activity within your journal remains completely private to you and your partner.
            </p>
          </section>

          <section>
            <h2 className="font-title text-2xl text-rose-950">4. Managing Cookies in Your Browser</h2>
            <p className="mt-4 text-sm leading-7 text-rose-950/75">
              You can block or clear cookies via your browser settings at any time. Note that disabling essential session cookies will prevent you from signing in to your journal.
            </p>
          </section>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
