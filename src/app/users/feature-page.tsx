"use client";

import { CalendarDays, Camera, Check, ChevronLeft, Eye, Film, Heart, ImagePlus, LockKeyhole, Mic2, Pencil, Play, Sparkles, Trash2, Upload, Video, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { SiteFooter } from "../../components/site-footer";
import { SiteNav } from "../../components/site-nav";
import { ScrollReveal } from "../../components/scroll-reveal";
import { useTheme } from "../theme-provider";

type Feature = "capture" | "studio" | "calendar" | "diary";
type DiaryEntry = { id: number; date: string; mood: string; title: string; text: string };

const featureCopy = {
  capture: { eyebrow: "Keep the moment", title: "Capture together", description: "Bring in the photos and clips that make today worth remembering.", icon: ImagePlus },
  studio: { eyebrow: "Make something from it", title: "Compilation studio", description: "Turn a handful of moments into a story you can replay.", icon: Film },
  calendar: { eyebrow: "Make time for us", title: "Shared calendar", description: "A simple place for plans, dates, and the days you are already looking forward to.", icon: CalendarDays },
  diary: { eyebrow: "Put it somewhere safe", title: "Private diary", description: "A place for the full truth of the day: the frustrations, the happiness, and everything between.", icon: Heart },
};

function Heading({ feature }: { feature: Feature }) {
  const copy = featureCopy[feature]; const Icon = copy.icon;
  return <header className="feature-page-heading"><a href="/users" className="feature-back"><ChevronLeft size={16} /> Back to journal</a><p className="workspace-eyebrow"><Icon size={15} /> {copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.description}</p></header>;
}

function Capture() {
  return <div className="feature-content capture-grid"><label className="upload-dropzone feature-dropzone"><input type="file" accept="image/*,video/*" multiple /><Upload size={30} /><strong>Drop photos or videos here</strong><span>or choose from your device</span><small>JPG, PNG, MP4 up to 50 MB</small></label><div className="capture-side"><button type="button" className="capture-action"><Camera size={20} /><span><strong>Take a photo</strong><small>Save a little piece of right now</small></span></button><button type="button" className="capture-action"><Video size={20} /><span><strong>Record a moment</strong><small>Make a clip for your future selves</small></span></button><div className="feature-info"><Sparkles size={17} /><p>Later, smart sorting can recognize places, people, and the feeling behind each moment.</p></div></div></div>;
}

function Studio() {
  return <div className="feature-content studio-page-grid"><div className="studio-preview"><div className="studio-filmstrip"><div className="memory-coral" /><div className="memory-rose" /><div className="memory-lilac" /></div><div className="studio-play"><Play size={23} fill="currentColor" /></div><div className="studio-preview-copy"><span className="workspace-eyebrow">Draft compilation</span><h2>August, in little pieces</h2><p>12 moments · 02:48 total</p></div></div><div className="feature-form"><label>Story title<input defaultValue="August, in little pieces" /></label><label>Compilation mood<select defaultValue="warm"><option value="warm">Warm and nostalgic</option><option value="bright">Bright and playful</option><option value="quiet">Quiet and cinematic</option></select></label><label>Music feeling<select defaultValue="soft"><option value="soft">Soft piano</option><option value="sunny">Sunny afternoon</option><option value="none">No music</option></select></label><button type="button" className="workspace-primary"><Sparkles size={16} /> Create mock compilation</button><p className="workspace-hint">This is a design preview. Video generation will be connected later.</p></div></div>;
}

function Calendar() {
  const days = Array.from({ length: 30 }, (_, index) => index + 1);
  return <div className="feature-content calendar-layout"><div className="calendar-card"><div className="calendar-top"><button type="button">&#8592;</button><h2>September 2026</h2><button type="button">&#8594;</button></div><div className="calendar-weekdays">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{days.map((day) => <button type="button" key={day} className={[4, 12, 14, 25].includes(day) ? "has-event" : ""}>{day}{[4, 12, 14, 25].includes(day) ? <i /> : null}</button>)}</div></div><div className="upcoming-card"><span className="workspace-eyebrow">Coming up</span><div className="upcoming-event"><div className="date-block"><strong>14</strong><span>SEP</span></div><div><h3>Our day</h3><p>Anniversary dinner · 7:30 PM</p><span><Heart size={13} fill="currentColor" /> Both of us</span></div></div><div className="upcoming-event"><div className="date-block"><strong>25</strong><span>SEP</span></div><div><h3>Dinner at home</h3><p>Try the new pasta recipe</p><span><Heart size={13} fill="currentColor" /> Both of us</span></div></div><button type="button" className="workspace-secondary"><CalendarDays size={15} /> Add a shared plan</button></div></div>;
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
    setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, text: draft } : entry));
    setEditingId(null);
  };

  return <section className="past-entries interactive-history"><div className="past-entries-heading"><div><span className="workspace-eyebrow">Your reflections</span><h2>Past entries</h2></div><span className="past-entry-count">{entries.length} notes</span></div><div className="history-scroll">{entries.map((entry) => <motion.article whileHover={{ y: -4 }} transition={{ duration: .2 }} className="past-entry" key={entry.id} onClick={() => setViewing(entry)}><div className="past-entry-date"><strong>{entry.date.split(" ")[1].replace(",", "")}</strong><span>{entry.date.split(" ")[0].slice(0, 3).toUpperCase()}</span></div><div><div className="past-entry-meta"><span>{entry.date}</span><span className="past-entry-mood">{entry.mood}</span></div>{editingId === entry.id ? <div className="history-editor" onClick={(event) => event.stopPropagation()}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} /><div><button type="button" className="workspace-secondary" onClick={() => setEditingId(null)}>Cancel</button><button type="button" className="workspace-primary" onClick={() => updateEntry(entry.id)}><Check size={14} /> Update</button></div></div> : <><h3>{entry.title}</h3><p>{entry.text}</p><div className="history-actions"><button type="button" aria-label="View note" data-tooltip="View" onClick={(event) => { event.stopPropagation(); setViewing(entry); }}><Eye size={15} /></button><button type="button" aria-label="Edit note" data-tooltip="Edit" onClick={(event) => { event.stopPropagation(); beginEdit(entry); }}><Pencil size={15} /></button><button type="button" className="danger" aria-label="Delete note" data-tooltip="Delete" onClick={(event) => { event.stopPropagation(); setEntries((current) => current.filter((item) => item.id !== entry.id)); }}><Trash2 size={15} /></button></div></>}</div></motion.article>)}</div><AnimatePresence>{viewing ? <motion.div className="history-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(event) => { if (event.target === event.currentTarget) setViewing(null); }}><motion.div className="history-modal-card" initial={{ opacity: 0, y: 22, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .98 }}><button type="button" className="journal-close" onClick={() => setViewing(null)} aria-label="Close note"><X size={17} /></button><span className="workspace-eyebrow">{viewing.date} · {viewing.mood}</span><h3>{viewing.title}</h3><p>{viewing.text}</p><div className="history-modal-actions"><button type="button" aria-label="Edit note" data-tooltip="Edit" onClick={() => beginEdit(viewing)}><Pencil size={16} /></button><button type="button" className="danger" aria-label="Delete note" data-tooltip="Delete" onClick={() => { setEntries((current) => current.filter((item) => item.id !== viewing.id)); setViewing(null); }}><Trash2 size={16} /></button></div></motion.div></motion.div> : null}</AnimatePresence></section>;
}

function Diary() {
  const [mood, setMood] = useState("Soft");
  return <div className="feature-content diary-page-layout"><div className="diary-layout"><div className="diary-editor"><div className="diary-toolbar"><span>Today, September 13</span><div><button type="button" aria-label="Add photo"><ImagePlus size={16} /></button><button type="button" aria-label="Record voice note"><Mic2 size={16} /></button></div></div><textarea placeholder="What is on your heart today?" /><div className="diary-footer"><div className="mood-picker"><span>Today feels</span>{["Soft", "Bright", "Heavy", "Hopeful"].map((item) => <button key={item} type="button" className={mood === item ? "active" : ""} onClick={() => setMood(item)}>{item}</button>)}</div><button type="button" className="workspace-primary"><Check size={15} /> Save entry</button></div></div><aside className="diary-prompt"><Sparkles size={18} /><span className="workspace-eyebrow">A thought to carry</span><p>“You do not have to make a moment perfect for it to be worth keeping.”</p><small>Your diary is private by default.</small></aside></div><DiaryHistory /></div>;
}

export function FeaturePage({ feature }: { feature: Feature }) {
  const { isNight } = useTheme();
  return <main className={`feature-page ${isNight ? "is-night" : ""}`}><SiteNav variant="journal" /><div className="feature-page-shell"><ScrollReveal direction="left"><Heading feature={feature} /></ScrollReveal><ScrollReveal>{feature === "capture" ? <Capture /> : null}{feature === "studio" ? <Studio /> : null}{feature === "calendar" ? <Calendar /> : null}{feature === "diary" ? <Diary /> : null}</ScrollReveal><ScrollReveal><section className="feature-note"><LockKeyhole size={16} /><span>Everything here is a design preview. Your memories stay yours.</span></section></ScrollReveal></div><SiteFooter homeHref="/users" /></main>;
}
