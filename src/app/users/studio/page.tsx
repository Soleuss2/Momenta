"use client";

import { ChevronLeft, Film, LockKeyhole, Play, Sparkles } from "lucide-react";
import { SiteFooter } from "../../../components/site-footer";
import { SiteNav } from "../../../components/site-nav";
import { ScrollReveal } from "../../../components/scroll-reveal";
import { useTheme } from "../../theme-provider";

import { sanitizeTitle } from "@/lib/sanitize";
import { useState } from "react";

function StudioHeading() {
  return (
    <header className="feature-page-heading">
      <a href="/users" className="feature-back">
        <ChevronLeft size={16} /> Back to journal
      </a>
      <p className="workspace-eyebrow">
        <Film size={15} /> Make something from it
      </p>
      <h1>Compilation studio</h1>
      <p>Turn a handful of moments into a story you can replay.</p>
    </header>
  );
}

function StudioContent() {
  const [title, setTitle] = useState("August, in little pieces");

  return (
    <div className="feature-content studio-page-grid">
      <div className="studio-preview">
        <div className="studio-filmstrip">
          <div className="memory-coral" />
          <div className="memory-rose" />
          <div className="memory-lilac" />
        </div>
        <div className="studio-play">
          <Play size={23} fill="currentColor" />
        </div>
        <div className="studio-preview-copy">
          <span className="workspace-eyebrow">Draft compilation</span>
          <h2>{title || "Untitled story"}</h2>
          <p>12 moments · 02:48 total</p>
        </div>
      </div>
      <div className="feature-form">
        <label>
          Story title
          <input
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(sanitizeTitle(e.target.value, 80))}
          />
        </label>
        <label>
          Compilation mood
          <select defaultValue="warm">
            <option value="warm">Warm and nostalgic</option>
            <option value="bright">Bright and playful</option>
            <option value="quiet">Quiet and cinematic</option>
          </select>
        </label>
        <label>
          Music feeling
          <select defaultValue="soft">
            <option value="soft">Soft piano</option>
            <option value="sunny">Sunny afternoon</option>
            <option value="none">No music</option>
          </select>
        </label>
        <button type="button" className="workspace-primary">
          <Sparkles size={16} /> Create mock compilation
        </button>
        <p className="workspace-hint">This is a design preview. Video generation will be connected later.</p>
      </div>
    </div>
  );
}

export default function StudioPage() {
  const { isNight } = useTheme();

  return (
    <main className={`feature-page ${isNight ? "is-night" : ""}`}>
      <SiteNav variant="journal" />
      <div className="feature-page-shell">
        <ScrollReveal direction="left">
          <StudioHeading />
        </ScrollReveal>
        <ScrollReveal>
          <StudioContent />
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
