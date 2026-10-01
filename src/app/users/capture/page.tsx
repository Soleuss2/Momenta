"use client";

import { Camera, ChevronLeft, ImagePlus, LockKeyhole, Upload, Video, Sparkles } from "lucide-react";
import { SiteFooter } from "../../../components/site-footer";
import { SiteNav } from "../../../components/site-nav";
import { ScrollReveal } from "../../../components/scroll-reveal";
import { useTheme } from "../../theme-provider";

function CaptureHeading() {
  return (
    <header className="feature-page-heading">
      <a href="/users" className="feature-back">
        <ChevronLeft size={16} /> Back to journal
      </a>
      <p className="workspace-eyebrow">
        <ImagePlus size={15} /> Keep the moment
      </p>
      <h1>Capture together</h1>
      <p>Bring in the photos and clips that make today worth remembering.</p>
    </header>
  );
}

function CaptureContent() {
  return (
    <div className="feature-content capture-grid">
      <label className="upload-dropzone feature-dropzone">
        <input type="file" accept="image/*,video/*" multiple />
        <Upload size={30} />
        <strong>Drop photos or videos here</strong>
        <span>or choose from your device</span>
        <small>JPG, PNG, MP4 up to 50 MB</small>
      </label>
      <div className="capture-side">
        <button type="button" className="capture-action">
          <Camera size={20} />
          <span>
            <strong>Take a photo</strong>
            <small>Save a little piece of right now</small>
          </span>
        </button>
        <button type="button" className="capture-action">
          <Video size={20} />
          <span>
            <strong>Record a moment</strong>
            <small>Make a clip for your future selves</small>
          </span>
        </button>
        <div className="feature-info">
          <Sparkles size={17} />
          <p>Later, smart sorting can recognize places, people, and the feeling behind each moment.</p>
        </div>
      </div>
    </div>
  );
}

export default function CapturePage() {
  const { isNight } = useTheme();

  return (
    <main className={`feature-page ${isNight ? "is-night" : ""}`}>
      <SiteNav variant="journal" />
      <div className="feature-page-shell">
        <ScrollReveal direction="left">
          <CaptureHeading />
        </ScrollReveal>
        <ScrollReveal>
          <CaptureContent />
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
