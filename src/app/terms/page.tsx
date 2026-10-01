"use client";

import { FileText, ShieldAlert, HeartHandshake, CheckCircle2 } from "lucide-react";
import { SiteFooter } from "../../components/site-footer";
import { SiteNav } from "../../components/site-nav";
import { useTheme } from "../theme-provider";

export default function TermsOfServicePage() {
  const { isNight } = useTheme();

  return (
    <main className={`marketing-shell ${isNight ? "is-night" : ""}`}>
      <SiteNav variant="public" />

      <section className="hero-grid min-h-0 pt-16 pb-8">
        <div className="hero-copy max-w-3xl">
          <p className="eyebrow">
            <FileText size={15} /> Terms of Service
          </p>
          <h1 className="mt-4 font-title text-4xl text-rose-950 sm:text-6xl">
            A simple agreement of <em>trust.</em>
          </h1>
          <p className="mt-5 text-base leading-7 text-rose-950/70 sm:text-lg">
            By using Momenta, you agree to these terms. We keep them clear, transparent, and respectful of your relationship and your privacy.
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-rose-900/40">
            Last updated: October 2026
          </p>
        </div>
      </section>

      <div className="mx-auto w-[min(1180px,calc(100%-3rem))] pb-24">
        <div className="space-y-12 rounded-3xl border border-rose-200/80 bg-white/60 p-8 sm:p-12 text-rose-950 shadow-sm backdrop-blur-sm">
          <section>
            <h2 className="font-title text-2xl text-rose-950">1. Acceptance & Purpose</h2>
            <p className="mt-4 text-sm leading-7 text-rose-950/75">
              Momenta is designed as an intimate digital memory capsule and shared journal. By creating an account or accessing the platform, you agree to comply with and be bound by these Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="font-title text-2xl text-rose-950">2. Account Responsibility & Access</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-rose-950/75">
              <p>
                You are responsible for maintaining the confidentiality of your credentials. You agree to notify us immediately of any unauthorized access or security breach.
              </p>
              <p>
                Because Momenta is built for shared memory keeping between two people, permissions and shared entries are accessible to the connected pair.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-title text-2xl text-rose-950">3. Your Content & Intellectual Property</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-rose-950/75">
              <p>
                <strong>You own everything you create:</strong> We claim no intellectual property rights over the notes, photos, clips, audio, or stories you submit to Momenta.
              </p>
              <p>
                We only store and process your content as strictly required to deliver the journal service to you and your partner.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-title text-2xl text-rose-950">4. Acceptable Use Standards</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-rose-950/75">
              <p>
                You agree not to misuse the service. You may not:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Upload illegal, abusive, infringing, or malicious content.</li>
                <li>Attempt to bypass rate limits, probe vulnerabilities, or bombard server endpoints.</li>
                <li>Scrape, reverse engineer, or decompile any part of the service.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-title text-2xl text-rose-950">5. Service Availability & Termination</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-rose-950/75">
              <p>
                We strive for continuous, reliable uptime. However, services are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. You may discontinue your use and delete your account at any time.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-title text-2xl text-rose-950">6. Questions</h2>
            <p className="mt-4 text-sm leading-7 text-rose-950/75">
              For questions regarding our terms, please contact{" "}
              <a href="mailto:support@momenta.app" className="font-semibold text-rose-700 underline decoration-rose-300">
                support@momenta.app
              </a>.
            </p>
          </section>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
