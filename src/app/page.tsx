"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  CalendarDays,
  Camera,
  Gem,
  Heart,
  MapPin,
  MessageCircleHeart,
  Play,
  Sparkles,
  Star,
  Trash2,
  Archive,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Memory = {
  id: number;
  title: string;
  date: string;
  location: string;
  description: string;
  tag: "Trips" | "Daily Life" | "Milestones";
  accentSurface: string;
  accentStrong: string;
  videoUrl?: string;
  highlights: string[];
  archived?: boolean;
};

const initialMemories: Memory[] = [
  {
    id: 1,
    title: "Sunset On The Pier",
    date: "May 12, 2025",
    location: "Manila Bay",
    description:
      "We chased golden light, forgot the time, and ended up laughing over street food until midnight.",
    tag: "Trips",
    accentSurface: "bg-pink-200/90",
    accentStrong: "bg-pink-500",
    videoUrl: "https://www.youtube.com/embed/ScMzIvxBSi4",
    highlights: ["First travel vlog together", "Unplanned date night", "Favorite photos"],
  },
  {
    id: 2,
    title: "Rainy Day Cooking",
    date: "August 4, 2025",
    location: "Home Kitchen",
    description:
      "A power outage turned into candlelight cooking and the best comfort meal we have ever made.",
    tag: "Daily Life",
    accentSurface: "bg-pink-100/90",
    accentStrong: "bg-pink-500",
    highlights: ["Pasta experiment", "Kitchen dance break", "Voice notes to remember"],
  },
  {
    id: 3,
    title: "Anniversary Rooftop",
    date: "November 21, 2025",
    location: "City Center",
    description:
      "We wrote small promises for next year and watched the skyline flicker as the night got colder.",
    tag: "Milestones",
    accentSurface: "bg-pink-100/90",
    accentStrong: "bg-pink-500",
    videoUrl: "https://www.youtube.com/embed/LXb3EKWsInQ",
    highlights: ["Promise letters", "Timelapse clip", "Our favorite playlist"],
  },
  {
    id: 4,
    title: "Cafe Journal Day",
    date: "January 18, 2026",
    location: "Old Town Cafe",
    description:
      "We spent the afternoon journaling, sketching future goals, and collecting tiny moments worth keeping.",
    tag: "Daily Life",
    accentSurface: "bg-pink-200/80",
    accentStrong: "bg-pink-600",
    highlights: ["Couple journal entries", "Polaroid set", "Vision board ideas"],
  },
];

const filters = ["All", "Trips", "Daily Life", "Milestones"] as const;

const floatingHearts = [
  { id: 1, left: "10%", top: "18%", size: 28, delay: "0s" },
  { id: 2, left: "28%", top: "68%", size: 18, delay: "-2.4s" },
  { id: 3, left: "58%", top: "12%", size: 22, delay: "-1.1s" },
  { id: 4, left: "78%", top: "48%", size: 32, delay: "-3.6s" },
  { id: 5, left: "88%", top: "76%", size: 16, delay: "-0.8s" },
];

const particles = [
  { id: 1, left: "8%", top: "18%", size: 9, depth: "soft", delay: "-1.2s" },
  { id: 2, left: "21%", top: "62%", size: 6, depth: "soft", delay: "-2.7s" },
  { id: 3, left: "36%", top: "28%", size: 8, depth: "deep", delay: "-0.9s" },
  { id: 4, left: "49%", top: "72%", size: 10, depth: "deep", delay: "-3.1s" },
  { id: 5, left: "63%", top: "14%", size: 6, depth: "soft", delay: "-2.2s" },
  { id: 6, left: "74%", top: "40%", size: 11, depth: "deep", delay: "-1.6s" },
  { id: 7, left: "86%", top: "67%", size: 7, depth: "soft", delay: "-2.9s" },
  { id: 8, left: "92%", top: "22%", size: 9, depth: "deep", delay: "-0.4s" },
];

type TiltCardProps = {
  children: ReactNode;
  className: string;
};

function TiltCard({ children, className }: TiltCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 40 });

  return (
    <motion.div
      onMouseMove={(event) => {
        if (prefersReducedMotion) {
          return;
        }
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;
        const centerX = bounds.width / 2;
        const centerY = bounds.height / 2;
        const rotateY = ((x - centerX) / centerX) * 14;
        const rotateX = ((centerY - y) / centerY) * 12;
        setTilt({
          rotateX,
          rotateY,
          glareX: (x / bounds.width) * 100,
          glareY: (y / bounds.height) * 100,
        });
      }}
      onMouseLeave={() => setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 40 })}
      animate={{
        rotateX: prefersReducedMotion ? 0 : tilt.rotateX,
        rotateY: prefersReducedMotion ? 0 : tilt.rotateY,
        z: prefersReducedMotion ? 0 : 28,
      }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.025 }}
      transition={{ type: "spring", stiffness: 220, damping: 18, mass: 0.45 }}
      style={{ transformStyle: "preserve-3d" }}
      className={`tilt-card ${className}`}
    >
      <div
        className="tilt-glare"
        style={{
          background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.58), transparent 55%)`,
        }}
      />
      {children}
    </motion.div>
  );
}

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (memory: Omit<Memory, "id" | "accentSurface" | "accentStrong">) => void;
}

function AddMemoryModal({ isOpen, onClose, onAdd }: AddMemoryModalProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState<"Trips" | "Daily Life" | "Milestones">("Daily Life");
  const [videoUrl, setVideoUrl] = useState("");
  const [highlightsInput, setHighlightsInput] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !location || !description) {
      alert("Please fill in all required fields.");
      return;
    }

    const highlights = highlightsInput
      .split(",")
      .map((h) => h.trim())
      .filter((h) => h.length > 0);

    onAdd({
      title,
      date,
      location,
      description,
      tag,
      videoUrl: videoUrl.trim() || undefined,
      highlights,
    });

    // Reset fields
    setTitle("");
    setDate("");
    setLocation("");
    setDescription("");
    setTag("Daily Life");
    setVideoUrl("");
    setHighlightsInput("");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-pink-950/45 px-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 12, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-pink-200/80 bg-white/95 shadow-[0_24px_80px_-28px_rgba(176,20,90,0.55)]"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="bg-pink-500 h-2" />
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-title text-2xl font-bold text-pink-950">Add New Memory</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-pink-200 p-1.5 text-pink-800 transition hover:bg-pink-50 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pink-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-pink-200 px-3 py-2 text-sm text-pink-950 focus:border-pink-400 focus:outline-none"
                placeholder="e.g. Cooking Pasta Together"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-pink-700 mb-1">
                  Date *
                </label>
                <input
                  type="text"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-pink-200 px-3 py-2 text-sm text-pink-950 focus:border-pink-400 focus:outline-none"
                  placeholder="e.g. August 24, 2026"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-pink-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-pink-200 px-3 py-2 text-sm text-pink-950 focus:border-pink-400 focus:outline-none"
                  placeholder="e.g. Home Kitchen"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pink-700 mb-1">
                Category Tag *
              </label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value as "Trips" | "Daily Life" | "Milestones")}
                className="w-full rounded-xl border border-pink-200 px-3 py-2 text-sm text-pink-950 focus:border-pink-400 focus:outline-none bg-white"
              >
                <option value="Trips">Trips</option>
                <option value="Daily Life">Daily Life</option>
                <option value="Milestones">Milestones</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pink-700 mb-1">
                Description *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-pink-200 px-3 py-2 text-sm text-pink-950 focus:border-pink-400 focus:outline-none"
                placeholder="Write a small cozy memory..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pink-700 mb-1">
                Video URL (Optional YouTube Embed)
              </label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full rounded-xl border border-pink-200 px-3 py-2 text-sm text-pink-950 focus:border-pink-400 focus:outline-none"
                placeholder="e.g. https://www.youtube.com/embed/ScMzIvxBSi4"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pink-700 mb-1">
                Highlights (comma-separated tags)
              </label>
              <input
                type="text"
                value={highlightsInput}
                onChange={(e) => setHighlightsInput(e.target.value)}
                className="w-full rounded-xl border border-pink-200 px-3 py-2 text-sm text-pink-950 focus:border-pink-400 focus:outline-none"
                placeholder="e.g. Pasta night, Kitchen dance, Candles"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-pink-200 px-4 py-2 text-sm font-semibold text-pink-700 transition hover:bg-pink-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-pink-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-400 cursor-pointer"
              >
                Save Memory
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  const pageRef = useRef<HTMLElement | null>(null);
  const [memoriesList, setMemoriesList] = useState<Memory[]>(initialMemories);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<typeof filters[number] | "Archived">("All");
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const saved = localStorage.getItem("love_blog_memories");
    if (saved) {
      try {
        setMemoriesList(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved memories list", e);
      }
    }
  }, []);

  const saveMemories = (updated: Memory[]) => {
    setMemoriesList(updated);
    localStorage.setItem("love_blog_memories", JSON.stringify(updated));
  };

  const handleAddMemory = (newMemory: Omit<Memory, "id" | "accentSurface" | "accentStrong">) => {
    const surfaces = ["bg-pink-100/90", "bg-pink-200/90", "bg-rose-100/90", "bg-fuchsia-100/90"];
    const strongs = ["bg-pink-500", "bg-pink-600", "bg-rose-500", "bg-fuchsia-500"];
    const randomIndex = Math.floor(Math.random() * surfaces.length);

    const memory: Memory = {
      ...newMemory,
      id: memoriesList.length > 0 ? Math.max(...memoriesList.map((m) => m.id)) + 1 : 1,
      accentSurface: surfaces[randomIndex],
      accentStrong: strongs[randomIndex],
      archived: false,
    };

    saveMemories([memory, ...memoriesList]);
    setIsAddModalOpen(false);
  };

  const handleDeleteMemory = (id: number) => {
    if (confirm("Are you sure you want to delete this memory forever?")) {
      saveMemories(memoriesList.filter((m) => m.id !== id));
      if (selectedMemory?.id === id) {
        setSelectedMemory(null);
      }
    }
  };

  const handleToggleArchiveMemory = (id: number) => {
    saveMemories(
      memoriesList.map((m) => (m.id === id ? { ...m, archived: !m.archived } : m))
    );
    if (selectedMemory?.id === id) {
      setSelectedMemory(null);
    }
  };

  const { scrollYProgress } = useScroll({
    target: pageRef,
    offset: ["start start", "end end"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const leftOrbY = useTransform(scrollYProgress, [0, 1], [0, -170]);
  const rightOrbY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const rightOrbRotate = useTransform(scrollYProgress, [0, 1], [0, 28]);
  const pointerX = useMotionValue(50);
  const pointerY = useMotionValue(40);
  const smoothPointerX = useSpring(pointerX, { stiffness: 70, damping: 22, mass: 0.7 });
  const smoothPointerY = useSpring(pointerY, { stiffness: 70, damping: 22, mass: 0.7 });
  const softLayerX = useTransform(smoothPointerX, [0, 100], [-22, 22]);
  const softLayerY = useTransform(smoothPointerY, [0, 100], [-16, 16]);
  const deepLayerX = useTransform(smoothPointerX, [0, 100], [32, -32]);
  const deepLayerY = useTransform(smoothPointerY, [0, 100], [24, -24]);
  const sceneRotateY = useTransform(smoothPointerX, [0, 100], [16, -16]);
  const sceneRotateX = useTransform(smoothPointerY, [0, 100], [-11, 11]);
  const spotlightLeft = useTransform(smoothPointerX, (value) => `${value}%`);
  const spotlightTop = useTransform(smoothPointerY, (value) => `${value}%`);

  const filteredMemories = useMemo(() => {
    if (activeFilter === "Archived") {
      return memoriesList.filter((m) => m.archived === true);
    }
    const unarchived = memoriesList.filter((m) => !m.archived);
    if (activeFilter === "All") {
      return unarchived;
    }
    return unarchived.filter((m) => m.tag === activeFilter);
  }, [memoriesList, activeFilter]);

  return (
    <main
      ref={pageRef}
      className="love-page relative overflow-hidden px-4 pb-16 pt-24 sm:px-8 sm:pt-28 lg:px-14"
      onMouseMove={(event) => {
        if (prefersReducedMotion) {
          return;
        }
        pointerX.set((event.clientX / window.innerWidth) * 100);
        pointerY.set((event.clientY / window.innerHeight) * 100);
      }}
      onMouseLeave={() => {
        pointerX.set(50);
        pointerY.set(40);
      }}
    >
      <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-40 flex items-center justify-between w-[calc(100%-2rem)] max-w-xl rounded-full border border-white/70 bg-pink-50/75 px-6 py-3 shadow-[0_12px_36px_-10px_rgba(176,20,90,0.35)] backdrop-blur-md transition-all duration-300 hover:bg-pink-50/90">
        <a href="#hero" className="flex items-center gap-2 text-pink-950 transition hover:scale-105">
          <Heart className="fill-pink-500 text-pink-500 animate-pulse" size={18} />
          <span className="font-title text-xl font-bold tracking-wide">Our Journal</span>
        </a>
        <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-pink-800">
          <a href="#hero" className="transition duration-200 hover:text-pink-500">Home</a>
          <a href="#memories" className="transition duration-200 hover:text-pink-500">Memories</a>
          <a href="#videos" className="transition duration-200 hover:text-pink-500">Videos</a>
          {isAdminMode ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="rounded-full bg-pink-500 px-3 py-1 text-[10px] font-bold text-white transition hover:bg-pink-400 cursor-pointer"
            >
              + Add
            </button>
          ) : null}
          <button
            onClick={() => {
              if (isAdminMode && activeFilter === "Archived") {
                setActiveFilter("All");
              }
              setIsAdminMode(!isAdminMode);
            }}
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold border transition cursor-pointer ${
              isAdminMode
                ? "bg-pink-700 text-white border-pink-800 hover:bg-pink-600"
                : "border-pink-300 text-pink-800 hover:bg-pink-100"
            }`}
          >
            {isAdminMode ? "Admin: On" : "Admin"}
          </button>
        </div>
      </nav>

      <div className="pointer-events-none fixed inset-0 -z-30 scene-3d">
        <motion.div
          aria-hidden
          className="scene-stage"
          style={
            prefersReducedMotion
              ? undefined
              : { rotateX: sceneRotateX, rotateY: sceneRotateY }
          }
        >
          <div className="scene-plane" />
          <div className="scene-floor" />
          <div className="scene-orb scene-orb-a" />
          <div className="scene-orb scene-orb-b" />
          <div className="scene-orb scene-orb-c" />
          <div className="scene-ring scene-ring-a" />
          <div className="scene-ring scene-ring-b" />
          {floatingHearts.map((heart) => (
            <Heart
              key={heart.id}
              className="scene-heart fill-pink-400"
              size={heart.size}
              style={{ left: heart.left, top: heart.top, animationDelay: heart.delay }}
            />
          ))}
        </motion.div>

        <motion.div
          aria-hidden
          className="scene-spotlight"
          style={
            prefersReducedMotion
              ? { left: "50%", top: "40%" }
              : { left: spotlightLeft, top: spotlightTop }
          }
        />

        <motion.div
          aria-hidden
          style={prefersReducedMotion ? undefined : { x: softLayerX, y: softLayerY }}
          className="scene-particles"
        >
          {particles
            .filter((particle) => particle.depth === "soft")
            .map((particle) => (
              <span
                key={`soft-${particle.id}`}
                className="scene-particle"
                style={{
                  left: particle.left,
                  top: particle.top,
                  width: particle.size,
                  height: particle.size,
                  animationDelay: particle.delay,
                }}
              />
            ))}
        </motion.div>

        <motion.div
          aria-hidden
          style={prefersReducedMotion ? undefined : { x: deepLayerX, y: deepLayerY }}
          className="scene-particles"
        >
          {particles
            .filter((particle) => particle.depth === "deep")
            .map((particle) => (
              <span
                key={`deep-${particle.id}`}
                className="scene-particle scene-particle-deep"
                style={{
                  left: particle.left,
                  top: particle.top,
                  width: particle.size,
                  height: particle.size,
                  animationDelay: particle.delay,
                }}
              />
            ))}
        </motion.div>

        <div className="scene-vignette" />
        <div className="scene-grain" />
      </div>

      <div className="relative z-10">
      <motion.div
        style={prefersReducedMotion ? undefined : { y: leftOrbY }}
        className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-pink-300/45 blur-2xl"
      />
      <motion.div
        style={prefersReducedMotion ? undefined : { y: rightOrbY, rotate: rightOrbRotate }}
        className="pointer-events-none absolute -right-24 top-56 h-80 w-80 rounded-full bg-pink-400/30 blur-2xl"
      />

      <section id="hero" className="mx-auto w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          style={prefersReducedMotion ? undefined : { y: heroY }}
          className="glass-panel rounded-[2rem] p-6 sm:p-10"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-200/80 bg-white/80 px-4 py-2 text-sm tracking-wide text-pink-800">
            <Sparkles size={16} />
            Our Living Love Journal
          </div>
          <h1 className="font-title text-4xl leading-tight text-pink-950 sm:text-6xl">
            A stylish memory space
            <br />
            for us, one moment at a time.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-pink-900/80 sm:text-lg">
            This blog captures our memories, videos, tiny milestones, and everyday stories in one interactive place.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#memories"
              className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-pink-400"
            >
              <Heart size={16} />
              Explore Memories
            </a>
            <a
              href="#videos"
              className="inline-flex items-center gap-2 rounded-full border border-pink-300/70 bg-white/85 px-5 py-3 text-sm font-semibold text-pink-950 transition hover:-translate-y-0.5 hover:border-pink-400"
            >
              <Play size={16} />
              Watch Moments
            </a>
          </div>
        </motion.div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.55 }}
        className="mx-auto mt-10 w-full max-w-6xl"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Mood Capsule",
              icon: MessageCircleHeart,
              text: "Small notes and feelings from each date.",
            },
            {
              title: "Memory Gems",
              icon: Gem,
              text: "Our best captured moments in one place.",
            },
            {
              title: "Favorite Sparks",
              icon: Star,
              text: "Things we want to relive next weekend.",
            },
          ].map((item, index) => (
            <TiltCard
              key={item.title}
              className="rounded-3xl border border-pink-200/80 bg-white/80 p-5 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.4 }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="depth-layer"
              >
                <item.icon size={20} className="text-pink-500" />
                <h3 className="mt-3 font-title text-2xl text-pink-950">{item.title}</h3>
                <p className="mt-2 text-sm text-pink-900/75">{item.text}</p>
              </motion.div>
            </TiltCard>
          ))}
        </div>
      </motion.section>

      <section id="memories" className="mx-auto mt-12 w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.35 }}
          transition={{ duration: 0.55 }}
          className="mb-6 flex flex-wrap items-center justify-between gap-4"
        >
          <h2 className="font-title text-3xl text-pink-950 sm:text-4xl">Memory Highlights</h2>
          <div className="flex flex-wrap gap-2 rounded-full border border-pink-300/80 bg-white/75 p-1 backdrop-blur">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-4 py-2 text-sm transition cursor-pointer ${
                  activeFilter === filter
                    ? "bg-pink-500 text-white"
                    : "text-pink-800 hover:bg-pink-500/10"
                }`}
              >
                {filter}
              </button>
            ))}
            {isAdminMode ? (
              <button
                type="button"
                onClick={() => setActiveFilter("Archived")}
                className={`rounded-full px-4 py-2 text-sm transition cursor-pointer ${
                  activeFilter === "Archived"
                    ? "bg-pink-500 text-white"
                    : "text-pink-800 hover:bg-pink-500/10"
                }`}
              >
                Archived
              </button>
            ) : null}
          </div>
        </motion.div>

        <motion.div layout className="grid gap-5 sm:grid-cols-2">
          {filteredMemories.map((memory, index) => (
            <motion.div
              key={memory.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="tilt-wrap"
            >
              <TiltCard className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_16px_48px_-20px_rgba(176,20,90,0.55)] backdrop-blur">
                <div
                  className={`pointer-events-none absolute inset-0 -z-10 opacity-70 transition group-hover:opacity-90 ${memory.accentSurface}`}
                />
                <div className="depth-layer mb-3 flex items-center justify-between text-pink-800">
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                    {memory.tag}
                  </span>
                  {isAdminMode ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleArchiveMemory(memory.id);
                        }}
                        title={memory.archived ? "Unarchive Memory" : "Archive Memory"}
                        className="rounded-full bg-white/80 p-1.5 hover:bg-pink-50 hover:text-pink-600 transition border border-pink-200/60 cursor-pointer shadow-sm"
                      >
                        <Archive size={14} className={memory.archived ? "text-pink-500 fill-pink-100" : ""} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMemory(memory.id);
                        }}
                        title="Delete Memory"
                        className="rounded-full bg-white/80 p-1.5 hover:bg-pink-50 hover:text-pink-600 transition border border-pink-200/60 cursor-pointer shadow-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <Camera size={16} />
                  )}
                </div>
                <h3 className="depth-layer font-title text-3xl text-pink-950">{memory.title}</h3>
                <p className="depth-layer mt-3 text-sm leading-6 text-pink-900/85">{memory.description}</p>

                <div className="depth-layer mt-5 flex flex-wrap gap-3 text-xs text-pink-800">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1">
                    <CalendarDays size={14} />
                    {memory.date}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1">
                    <MapPin size={14} />
                    {memory.location}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMemory(memory)}
                  className="depth-layer mt-6 inline-flex items-center gap-2 rounded-full bg-pink-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-400 cursor-pointer"
                >
                  Open Story
                  <Sparkles size={14} />
                </button>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <motion.section
        id="videos"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.35 }}
        transition={{ duration: 0.55 }}
        className="mx-auto mt-14 w-full max-w-6xl"
      >
        <h2 className="font-title text-3xl text-pink-950 sm:text-4xl">Video Moments</h2>
        <p className="mt-2 text-pink-900/75">Tap any card to open a clean popup player with details.</p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {memoriesList
            .filter((memory) => memory.videoUrl && !memory.archived)
            .map((memory) => (
              <div key={`video-${memory.id}`} className="tilt-wrap">
                <TiltCard className="group relative overflow-hidden rounded-3xl border border-pink-200/80 bg-white/85 p-5 text-left shadow-[0_14px_40px_-22px_rgba(176,20,90,0.55)]">
                  <button
                    type="button"
                    onClick={() => setSelectedMemory(memory)}
                    className="w-full text-left cursor-pointer"
                  >
                    <div className={`depth-layer h-28 rounded-2xl ${memory.accentSurface}`} />
                    <div className="depth-layer mt-4 flex items-center justify-between">
                      <h3 className="font-title text-2xl text-pink-950">{memory.title}</h3>
                      <Play className="text-pink-500 transition group-hover:scale-110" size={18} />
                    </div>
                    <p className="depth-layer mt-1 text-sm text-pink-800">{memory.date}</p>
                  </button>
                </TiltCard>
              </div>
            ))}
        </div>
      </motion.section>

      <AnimatePresence>
        {selectedMemory ? (
          <motion.div
            key="memory-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-pink-950/45 px-4 backdrop-blur-sm"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedMemory(null);
              }
            }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.96, rotateX: 8 }}
              animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ y: 12, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-3xl overflow-hidden rounded-3xl border border-pink-200/80 bg-white"
            >
              <div className={`h-2 ${selectedMemory.accentStrong}`} />
              <div className="p-5 sm:p-7">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-title text-3xl text-pink-950">{selectedMemory.title}</h3>
                  <button
                    type="button"
                    onClick={() => setSelectedMemory(null)}
                    aria-label="Close popup"
                    className="rounded-full border border-pink-200 p-2 text-pink-800 transition hover:bg-pink-50 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <p className="text-pink-900/80">{selectedMemory.description}</p>

                <ul className="mt-4 flex flex-wrap gap-2">
                  {selectedMemory.highlights.map((item) => (
                    <li
                      key={item}
                      className="rounded-full bg-pink-100 px-3 py-1 text-xs font-medium text-pink-800"
                    >
                      {item}
                    </li>
                  ))}
                </ul>

                {selectedMemory.videoUrl ? (
                  <div className="mt-5 overflow-hidden rounded-2xl border border-pink-200">
                    <iframe
                      className="aspect-video w-full"
                      src={selectedMemory.videoUrl}
                      title={`${selectedMemory.title} video`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}

        {isAddModalOpen ? (
          <AddMemoryModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAdd={handleAddMemory}
          />
        ) : null}
      </AnimatePresence>
      </div>
    </main>
  );
}
