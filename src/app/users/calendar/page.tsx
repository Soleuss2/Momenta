"use client";

import { CalendarDays, ChevronLeft, Heart, LockKeyhole } from "lucide-react";
import { SiteFooter } from "../../../components/site-footer";
import { SiteNav } from "../../../components/site-nav";
import { AmbientBackground } from "../../../components/ambient-background";
import { ScrollReveal } from "../../../components/scroll-reveal";
import { useTheme } from "../../theme-provider";

function CalendarHeading() {
  return (
    <header className="feature-page-heading">
      <a href="/users" className="feature-back">
        <ChevronLeft size={16} /> Back to journal
      </a>
      <p className="workspace-eyebrow">
        <CalendarDays size={15} /> Make time for us
      </p>
      <h1>Shared calendar</h1>
      <p>A simple place for plans, dates, and the days you are already looking forward to.</p>
    </header>
  );
}

function CalendarContent() {
  const days = Array.from({ length: 30 }, (_, index) => index + 1);

  return (
    <div className="feature-content calendar-layout">
      <div className="calendar-card">
        <div className="calendar-top">
          <button type="button">&#8592;</button>
          <h2>September 2026</h2>
          <button type="button">&#8594;</button>
        </div>
        <div className="calendar-weekdays">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="calendar-grid">
          {days.map((day) => (
            <button
              type="button"
              key={day}
              className={[4, 12, 14, 25].includes(day) ? "has-event" : ""}
            >
              {day}
              {[4, 12, 14, 25].includes(day) ? <i /> : null}
            </button>
          ))}
        </div>
      </div>
      <div className="upcoming-card">
        <span className="workspace-eyebrow">Coming up</span>
        <div className="upcoming-event">
          <div className="date-block">
            <strong>14</strong>
            <span>SEP</span>
          </div>
          <div>
            <h3>Our day</h3>
            <p>Anniversary dinner · 7:30 PM</p>
            <span>
              <Heart size={13} fill="currentColor" /> Both of us
            </span>
          </div>
        </div>
        <div className="upcoming-event">
          <div className="date-block">
            <strong>25</strong>
            <span>SEP</span>
          </div>
          <div>
            <h3>Dinner at home</h3>
            <p>Try the new pasta recipe</p>
            <span>
              <Heart size={13} fill="currentColor" /> Both of us
            </span>
          </div>
        </div>
        <button type="button" className="workspace-secondary">
          <CalendarDays size={15} /> Add a shared plan
        </button>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const { isNight } = useTheme();

  return (
    <main className={`feature-page ${isNight ? "is-night" : ""}`}>
      <AmbientBackground />
      <SiteNav variant="journal" />
      <div className="feature-page-shell">
        <ScrollReveal direction="left">
          <CalendarHeading />
        </ScrollReveal>
        <ScrollReveal>
          <CalendarContent />
        </ScrollReveal>
        <ScrollReveal>
          <section className="feature-note">
            <LockKeyhole size={16} />
            <span>Everything here is a design preview. Your memories stay yours.</span>
          </section>
        </ScrollReveal>
      </div>
      <SiteFooter homeHref="/users" />
    </main>
  );
}
