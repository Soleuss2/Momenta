"use client";

import { ArrowRight, Check, Heart, Mail, RefreshCw, Sparkles, Star } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SiteFooter } from "../components/site-footer";
import { SiteNav } from "../components/site-nav";
import { useTheme } from "./theme-provider";

const benefits = [
  "Keep your favorite moments in one private place",
  "Add photos, notes, videos, and little milestones",
  "Build a story you can return to together",
];

const chapters = [
  { number: "01", title: "Notice the ordinary", text: "The coffee runs, the inside jokes, the quiet rides home. The small things become the shape of a life together." },
  { number: "02", title: "Keep it close", text: "Gather words, pictures, and videos in one calm space instead of letting the best pieces disappear into a camera roll." },
  { number: "03", title: "Return to it", text: "A journal is not a feed. It is a place to come back to when you want to remember how it felt." },
];

const publicMoments = [
  { date: "September 10, 2026", title: "A slow morning together", text: "We made coffee, talked about the weekend, and let the morning take its time.", mood: "Hopeful" },
  { date: "August 4, 2026", title: "Rain on the windows", text: "A quiet afternoon, something warm to eat, and nowhere else we needed to be.", mood: "Soft" },
  { date: "July 22, 2026", title: "The long way home", text: "We took the scenic route and found a little café neither of us had noticed before.", mood: "Bright" },
];

const constellationMoments = [
  { id: 1, x: "12%", y: "28%", title: "First little trip", date: "May 2025", tone: "warm" },
  { id: 2, x: "34%", y: "62%", title: "Rainy day cooking", date: "August 2025", tone: "rose" },
  { id: 3, x: "57%", y: "24%", title: "Anniversary rooftop", date: "November 2025", tone: "gold" },
  { id: 4, x: "78%", y: "55%", title: "Café journal day", date: "January 2026", tone: "soft" },
  { id: 5, x: "91%", y: "25%", title: "The next chapter", date: "Still becoming", tone: "bright" },
];

export default function Home() {
  const { isNight } = useTheme();
  const pageRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: pageRef, offset: ["start start", "end end"] });
  const artY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const artRotate = useTransform(scrollYProgress, [0, 1], [-7, 5]);
  const [momentIndex, setMomentIndex] = useState(0);
  const [isMomentOpen, setIsMomentOpen] = useState(false);
  const [activeConstellation, setActiveConstellation] = useState(3);
  const [connectedThrough, setConnectedThrough] = useState<number | null>(null);
  const moment = publicMoments[momentIndex];
  const openNextMoment = () => {
    setIsMomentOpen(true);
    setMomentIndex((index) => (index + 1) % publicMoments.length);
  };
  useEffect(() => {
    if (!isMomentOpen) return;
    const closeTimer = window.setTimeout(() => setIsMomentOpen(false), 3000);
    return () => window.clearTimeout(closeTimer);
  }, [isMomentOpen, momentIndex]);

  return <main ref={pageRef} id="top" className={`marketing-shell ${isNight ? "is-night" : ""}`}>
    <SiteNav variant="public" />

    <section className="hero-grid">
      <motion.div className="hero-copy" initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
        <p className="eyebrow"><Sparkles size={15} /> A private space for two</p>
        <h1 className="mt-6 font-title text-6xl leading-[0.98] text-rose-950 sm:text-8xl">Keep the little things <em>close.</em></h1>
        <p className="mt-7 max-w-lg text-lg leading-8 text-rose-950/65">Momenta is a thoughtful place to collect the moments that make your story yours, from ordinary Tuesdays to once-in-a-lifetime days.</p>
        <div className="mt-9 flex flex-wrap items-center gap-4"><a href="/public/auth" className="primary-button">Start your journal <ArrowRight size={17} /></a><a href="#why" className="text-sm font-semibold text-rose-800 underline decoration-rose-300 underline-offset-8">See how it feels</a></div>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-rose-900/45">Made for memories, not metrics</p>
      </motion.div>
      <motion.div className="hero-art" aria-label="An abstract illustration of a shared journal" role="img" style={prefersReducedMotion ? undefined : { y: artY }}><div className="art-sun" /><motion.div className="art-envelope" style={prefersReducedMotion ? undefined : { rotate: artRotate }}><div className="art-paper art-paper-back" /><div className="art-paper art-paper-front"><div className="art-line art-line-short" /><div className="art-line" /><div className="art-line art-line-mid" /><Heart className="art-heart" size={62} fill="currentColor" /><span className="art-date">EST. US</span></div></motion.div><span className="art-caption">One moment at a time</span></motion.div>
    </section>

    <motion.section id="why" className="feature-band" initial={prefersReducedMotion ? undefined : { opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: .12 }} transition={{ duration: .65 }}><div><p className="eyebrow">Why it matters</p><h2 className="mt-3 max-w-md font-title text-4xl leading-tight text-rose-950">A softer way to remember.</h2><p className="section-copy">Not everything meaningful needs to be shared with the world. Some memories are better when they have room to stay yours.</p></div><ul className="feature-list">{benefits.map((benefit) => <li key={benefit}><span><Check size={14} /></span>{benefit}</li>)}</ul></motion.section>

    <motion.section id="story" className="story-section" initial={prefersReducedMotion ? undefined : { opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: .12 }} transition={{ duration: .65 }}><div className="story-heading"><p className="eyebrow">A story in three parts</p><h2 className="mt-3 font-title text-4xl leading-tight text-rose-950 sm:text-5xl">Made for the way real love happens.</h2></div><div className="chapter-list">{chapters.map((chapter, index) => <motion.article key={chapter.number} initial={prefersReducedMotion ? undefined : { opacity: 0, x: index % 2 ? 24 : -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: .12 }} transition={{ duration: .55, delay: index * .08 }}><span className="chapter-number">{chapter.number}</span><div><h3 className="font-title text-2xl text-rose-950">{chapter.title}</h3><p>{chapter.text}</p></div></motion.article>)}</div></motion.section>

    <motion.section className="moment-section" initial={prefersReducedMotion ? undefined : { opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: .12 }} transition={{ duration: .65 }}><div className="moment-copy"><p className="eyebrow"><Mail size={15} /> A little surprise</p><h2 className="mt-3 font-title text-4xl leading-tight text-rose-950 sm:text-5xl">Open a moment.</h2><p className="section-copy">A small glimpse of what Momenta is made to hold. Come back whenever you need something sweet.</p><button type="button" className="primary-button mt-6" onClick={openNextMoment}><RefreshCw size={16} /> {isMomentOpen ? "Open another" : "Open the envelope"}</button></div><div className={`moment-envelope ${isMomentOpen ? "open" : ""}`} onClick={openNextMoment} role="button" tabIndex={0} aria-label={isMomentOpen ? "Open another moment" : "Open a moment"} aria-expanded={isMomentOpen} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openNextMoment(); } }}><div className="envelope-flap" /><div className="envelope-heart"><Heart size={24} fill="currentColor" /></div><div className="moment-note"><span>{moment.date}</span><h3>{moment.title}</h3><p>{moment.text}</p><small>{moment.mood}</small></div></div></motion.section>

    <motion.section className="constellation-section" initial={prefersReducedMotion ? undefined : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: .12 }} transition={{ duration: .7 }}><div className="constellation-heading"><p className="eyebrow"><Star size={15} /> Explore the feeling</p><h2 className="mt-3 font-title text-4xl leading-tight text-rose-950 sm:text-5xl">Moments become a constellation.</h2><p className="section-copy">Hover over a star to see the kind of memories you could keep close.</p></div><div className={`constellation-map ${connectedThrough !== null ? "is-connecting" : ""}`}><svg className="constellation-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline key={connectedThrough ?? "empty"} pathLength="1" points={constellationMoments.slice(0, connectedThrough ?? 0).map((item) => `${parseFloat(item.x)},${parseFloat(item.y)}`).join(" ")} /></svg>{constellationMoments.map((item) => <button type="button" key={item.id} className={`constellation-star ${item.tone} ${activeConstellation === item.id ? "active" : ""}`} style={{ left: item.x, top: item.y }} onMouseEnter={() => setActiveConstellation(item.id)} onFocus={() => setActiveConstellation(item.id)} onClick={() => { setActiveConstellation(item.id); setConnectedThrough(item.id); }} aria-label={`${item.title}, ${item.date}`}><span /><div className="constellation-tooltip"><small>{item.date}</small><strong>{item.title}</strong></div></button>)}</div></motion.section>

    <motion.section className="quote-band" initial={prefersReducedMotion ? undefined : { opacity: 0, scale: .96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: false, amount: .12 }} transition={{ duration: .7 }}><Heart size={22} fill="currentColor" /><blockquote>“The memories we keep are the ones that teach us what home feels like.”</blockquote><span>— a note for later</span></motion.section>

    <motion.section id="how" className="closing-section" initial={prefersReducedMotion ? undefined : { opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: .12 }} transition={{ duration: .65 }}><p className="eyebrow">Begin anywhere</p><h2 className="mt-4 font-title text-4xl text-rose-950 sm:text-5xl">Your story is already worth keeping.</h2><p className="section-copy">Start with one photograph, one sentence, or one tiny detail you never want to forget.</p><a href="/public/auth" className="primary-button mt-7">Make it yours <ArrowRight size={17} /></a></motion.section>
    <SiteFooter />
  </main>;
}
