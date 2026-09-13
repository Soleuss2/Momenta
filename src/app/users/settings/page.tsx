"use client";

import { Check, ChevronDown, Heart, Image as ImageIcon, LockKeyhole, SlidersHorizontal, UserRound } from "lucide-react";
import { useState } from "react";
import { AmbientBackground } from "../../../components/ambient-background";
import { SiteNav } from "../../../components/site-nav";
import { ScrollReveal } from "../../../components/scroll-reveal";
import { useTheme } from "../../theme-provider";

const settingsSections = [
  { title: "Your profile", id: "profile-settings", icon: UserRound },
  { title: "Journal preferences", id: "journal-settings", icon: SlidersHorizontal },
  { title: "Privacy & access", id: "privacy-settings", icon: LockKeyhole },
] as const;
type SettingsSection = (typeof settingsSections)[number]["title"];

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: () => void }) {
  return <div className="settings-row"><div><strong>{label}</strong><p>{description}</p></div><button type="button" className={`settings-toggle ${checked ? "active" : ""}`} onClick={onChange} aria-pressed={checked} aria-label={`${label}: ${checked ? "on" : "off"}`}><span /></button></div>;
}

function ProfileSettings() {
  return <section id="profile-settings" className="settings-panel"><div className="settings-panel-heading"><div className="settings-icon"><UserRound size={18} /></div><div><h2>Profile</h2><p>How your names appear in the journal.</p></div></div><div className="settings-fields"><label>Journal name<input type="text" defaultValue="Alex & Jamie" /></label><label>Short note<input type="text" defaultValue="Our little corner of the world" /></label></div><button type="button" className="settings-save"><Check size={15} /> Save changes</button></section>;
}

function JournalSettings({ autoSort, setAutoSort, weeklyNotes, setWeeklyNotes }: { autoSort: boolean; setAutoSort: (value: boolean) => void; weeklyNotes: boolean; setWeeklyNotes: (value: boolean) => void }) {
  return <section id="journal-settings" className="settings-panel"><div className="settings-panel-heading"><div className="settings-icon"><SlidersHorizontal size={18} /></div><div><h2>Journal preferences</h2><p>Choose how your memories should behave.</p></div></div><Toggle label="Smart sorting" description="Group memories by date, place, and story type." checked={autoSort} onChange={() => setAutoSort(!autoSort)} /><Toggle label="Weekly notes" description="Leave space for a gentle weekly reflection." checked={weeklyNotes} onChange={() => setWeeklyNotes(!weeklyNotes)} /><label className="settings-select">Default view<span><ImageIcon size={16} /><select defaultValue="highlights"><option value="highlights">Memory highlights</option><option value="timeline">Timeline</option><option value="gallery">Photo gallery</option></select><ChevronDown size={16} /></span></label></section>;
}

function PrivacySettings({ privateJournal, setPrivateJournal, reminders, setReminders }: { privateJournal: boolean; setPrivateJournal: (value: boolean) => void; reminders: boolean; setReminders: (value: boolean) => void }) {
  return <section id="privacy-settings" className="settings-panel"><div className="settings-panel-heading"><div className="settings-icon"><LockKeyhole size={18} /></div><div><h2>Privacy & access</h2><p>Keep the shared journal comfortable and private.</p></div></div><Toggle label="Private journal" description="Only invited people can see your memories." checked={privateJournal} onChange={() => setPrivateJournal(!privateJournal)} /><Toggle label="Memory reminders" description="Gentle prompts to revisit moments you saved." checked={reminders} onChange={() => setReminders(!reminders)} /></section>;
}

export default function SettingsPage() {
  const { isNight } = useTheme();
  const [activeSection, setActiveSection] = useState<SettingsSection>("Your profile");
  const [privateJournal, setPrivateJournal] = useState(true);
  const [weeklyNotes, setWeeklyNotes] = useState(false);
  const [autoSort, setAutoSort] = useState(true);
  const [reminders, setReminders] = useState(true);
  const selectSection = (title: SettingsSection, id: string) => {
    setActiveSection(title);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return <main className={`settings-page ${isNight ? "is-night" : ""}`}><AmbientBackground /><SiteNav variant="journal" /><div className="settings-content"><ScrollReveal direction="left"><header className="settings-heading"><p className="eyebrow"><Heart size={15} /> Your space, your way</p><h1 className="font-title text-5xl text-pink-950 sm:text-6xl">Settings</h1><p>Make the journal feel a little more like you.</p></header></ScrollReveal><div className="settings-grid"><aside className="settings-menu">{settingsSections.map(({ title, id, icon: Icon }, index) => <button type="button" className={activeSection === title ? "selected" : ""} aria-current={activeSection === title ? "page" : undefined} onClick={() => selectSection(title, id)} key={title}><Icon size={17} />{title}</button>)}</aside><div className="settings-panels"><ScrollReveal><ProfileSettings /></ScrollReveal><ScrollReveal delay={.08}><JournalSettings autoSort={autoSort} setAutoSort={setAutoSort} weeklyNotes={weeklyNotes} setWeeklyNotes={setWeeklyNotes} /></ScrollReveal><ScrollReveal delay={.16}><PrivacySettings privateJournal={privateJournal} setPrivateJournal={setPrivateJournal} reminders={reminders} setReminders={setReminders} /></ScrollReveal></div></div></div></main>;
}
