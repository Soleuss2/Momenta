"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, Eye, Heart, ImagePlus, LockKeyhole, Mic2, Pencil, Sparkles, Trash2, X } from "lucide-react";
import { useState } from "react";
import { SiteFooter } from "../../../components/site-footer";
import { SiteNav } from "../../../components/site-nav";
import { AmbientBackground } from "../../../components/ambient-background";
import { ScrollReveal } from "../../../components/scroll-reveal";
import { useTheme } from "../../theme-provider";

import { sanitizeText } from "@/lib/sanitize";

type DiaryEntry = { id: number; date: string; mood: string; title: string; text: string };

function DiaryHeading() {
  return (
    <header className="feature-page-heading">
      <a href="/users" className="feature-back">
        <ChevronLeft size={16} /> Back to journal
      </a>
      <p className="workspace-eyebrow">
        <Heart size={15} /> Put it somewhere safe
      </p>
      <h1>Private diary</h1>
      <p>A place for the full truth of the day: the frustrations, the happiness, and everything between.</p>
    </header>
  );
}

function DiaryHistory() {
  const [entries, setEntries] = useState<DiaryEntry[]>([
    { id: 1, date: "September 10, 2026", mood: "Hopeful", title: "A slow morning together", text: "We made coffee, talked about the weekend, and let the morning take its time." },
    { id: 2, date: "September 6, 2026", mood: "Bright", title: "The best kind of tired", text: "A long day, a late dinner, and laughing about absolutely nothing on the way home." },
    { id: 3, date: "August 29, 2026", mood: "Heavy", title: "A little overwhelmed", text: "Today felt full. Writing it down made the noise in my head feel a little more organized." },
    { id: 4, date: "August 22, 2026", mood: "Soft", title: "A note to future us", text: "Remember this ordinary evening: warm food, open windows, and nowhere else to be." },
  ]);
  const [viewing, setViewing] = useState<DiaryEntry | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  const beginEdit = (entry: DiaryEntry) => {
    setEditingId(entry.id);
    setDraft(entry.text);
  };

  const updateEntry = (id: number) => {
    const cleanDraft = sanitizeText(draft, 2000);
    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, text: cleanDraft } : entry)));
    setEditingId(null);
  };

  return (
    <section className="past-entries interactive-history">
      <div className="past-entries-heading">
        <div>
          <span className="workspace-eyebrow">Your reflections</span>
          <h2>Past entries</h2>
        </div>
        <span className="past-entry-count">{entries.length} notes</span>
      </div>
      <div className="history-scroll">
        {entries.map((entry) => (
          <motion.article
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="past-entry"
            key={entry.id}
            onClick={() => setViewing(entry)}
          >
            <div className="past-entry-date">
              <strong>{entry.date.split(" ")[1].replace(",", "")}</strong>
              <span>{entry.date.split(" ")[0].slice(0, 3).toUpperCase()}</span>
            </div>
            <div>
              <div className="past-entry-meta">
                <span>{entry.date}</span>
                <span className="past-entry-mood">{entry.mood}</span>
              </div>
              {editingId === entry.id ? (
                <div className="history-editor" onClick={(event) => event.stopPropagation()}>
                  <textarea value={draft} onChange={(event) => setDraft(event.target.value)} />
                  <div>
                    <button type="button" className="workspace-secondary" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                    <button type="button" className="workspace-primary" onClick={() => updateEntry(entry.id)}>
                      <Check size={14} /> Update
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3>{entry.title}</h3>
                  <p>{entry.text}</p>
                  <div className="history-actions">
                    <button
                      type="button"
                      aria-label="View note"
                      data-tooltip="View"
                      onClick={(event) => {
                        event.stopPropagation();
                        setViewing(entry);
                      }}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      type="button"
                      aria-label="Edit note"
                      data-tooltip="Edit"
                      onClick={(event) => {
                        event.stopPropagation();
                        beginEdit(entry);
                      }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className="danger"
                      aria-label="Delete note"
                      data-tooltip="Delete"
                      onClick={(event) => {
                        event.stopPropagation();
                        setEntries((current) => current.filter((item) => item.id !== entry.id));
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.article>
        ))}
      </div>
      <AnimatePresence>
        {viewing ? (
          <motion.div
            className="history-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(event) => {
              if (event.target === event.currentTarget) setViewing(null);
            }}
          >
            <motion.div
              className="history-modal-card"
              initial={{ opacity: 0, y: 22, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
            >
              <button type="button" className="journal-close" onClick={() => setViewing(null)} aria-label="Close note">
                <X size={17} />
              </button>
              <span className="workspace-eyebrow">
                {viewing.date} · {viewing.mood}
              </span>
              <h3>{viewing.title}</h3>
              <p>{viewing.text}</p>
              <div className="history-modal-actions">
                <button type="button" aria-label="Edit note" data-tooltip="Edit" onClick={() => beginEdit(viewing)}>
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  className="danger"
                  aria-label="Delete note"
                  data-tooltip="Delete"
                  onClick={() => {
                    setEntries((current) => current.filter((item) => item.id !== viewing.id));
                    setViewing(null);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function DiaryContent() {
  const [mood, setMood] = useState("Soft");

  return (
    <div className="feature-content diary-page-layout">
      <div className="diary-layout">
        <div className="diary-editor">
          <div className="diary-toolbar">
            <span>Today, September 13</span>
            <div>
              <button type="button" aria-label="Add photo">
                <ImagePlus size={16} />
              </button>
              <button type="button" aria-label="Record voice note">
                <Mic2 size={16} />
              </button>
            </div>
          </div>
          <textarea placeholder="What is on your heart today?" />
          <div className="diary-footer">
            <div className="mood-picker">
              <span>Today feels</span>
              {["Soft", "Bright", "Heavy", "Hopeful"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={mood === item ? "active" : ""}
                  onClick={() => setMood(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <button type="button" className="workspace-primary">
              <Check size={15} /> Save entry
            </button>
          </div>
        </div>
        <aside className="diary-prompt">
          <Sparkles size={18} />
          <span className="workspace-eyebrow">A thought to carry</span>
          <p>“You do not have to make a moment perfect for it to be worth keeping.”</p>
          <small>Your diary is private by default.</small>
        </aside>
      </div>
      <DiaryHistory />
    </div>
  );
}

export default function DiaryPage() {
  const { isNight } = useTheme();

  return (
    <main className={`feature-page ${isNight ? "is-night" : ""}`}>
      <AmbientBackground />
      <SiteNav variant="journal" />
      <div className="feature-page-shell">
        <ScrollReveal direction="left">
          <DiaryHeading />
        </ScrollReveal>
        <ScrollReveal>
          <DiaryContent />
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
