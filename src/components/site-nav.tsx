"use client";

import { ArrowLeft, BookHeart, CalendarDays, Heart, ImagePlus, LogIn, LogOut, Moon, NotebookPen, Settings2, Sparkles, Sun, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "../app/theme-provider";
import { createClient } from "@/lib/supabase/client";

type SiteNavProps = {
  variant: "public" | "auth" | "journal";
};

type NavLink = { href: string; label: string; icon: LucideIcon };
type NavContent = { homeHref: string; actionHref: string | null; actionLabel: string | null; actionIcon: LucideIcon | null; links: NavLink[] };

const navContent = {
  public: { homeHref: "/", actionHref: "/auth", actionLabel: "Sign in", actionIcon: LogIn, links: [{ href: "/#why", label: "Why it matters", icon: BookHeart }, { href: "/#story", label: "Our story", icon: Heart }] },
  auth: { homeHref: "/", actionHref: "/", actionLabel: "Back to home", actionIcon: ArrowLeft, links: [] },
  journal: { homeHref: "/users", actionHref: null, actionLabel: "Log out", actionIcon: LogOut, links: [{ href: "/users", label: "Memories", icon: BookHeart }, { href: "/users/capture", label: "Capture", icon: ImagePlus }, { href: "/users/studio", label: "Studio", icon: Sparkles }, { href: "/users/calendar", label: "Calendar", icon: CalendarDays }, { href: "/users/diary", label: "Diary", icon: NotebookPen }, { href: "/users/settings", label: "Settings", icon: Settings2 }] },
} satisfies Record<SiteNavProps["variant"], NavContent>;

export function SiteNav({ variant }: SiteNavProps) {
  const { isNight, toggleTheme } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const content = navContent[variant];
  const ActionIcon = content.actionIcon;

  const handleSectionClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    const hash = href.includes("#") ? href.split("#")[1] : null;
    if (variant === "journal" && hash && window.location.pathname === "/users") {
      const target = document.getElementById(hash);
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setShowLogoutConfirm(false);
      router.replace("/auth");
    } catch {
      // Fallback redirect if network error
      router.replace("/auth");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <nav className={variant === "journal" ? "journal-nav" : "site-nav"}>
        <Link href={content.homeHref} className="flex items-center gap-2 text-rose-950" aria-label="Momenta home">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-rose-500 text-white"><Heart size={17} fill="currentColor" /></span>
          <span className="font-title text-xl font-semibold">Momenta</span>
        </Link>
        <div className="nav-tools">
          <div className={variant === "journal" ? "nav-links journal-links" : "hidden items-center gap-8 text-sm font-medium text-rose-900/70 sm:flex"}>
            {content.links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={(event) => handleSectionClick(event, href)} className="nav-link nav-icon-button" aria-label={label} data-tooltip={label}>
                <Icon size={16} /><span className="sr-only">{label}</span>
              </Link>
            ))}
          </div>
          <button type="button" className="theme-toggle nav-icon-button" onClick={toggleTheme} aria-label={isNight ? "Switch to light mode" : "Switch to dark mode"} data-tooltip={isNight ? "Light mode" : "Dark mode"}>
            {isNight ? <Sun size={16} /> : <Moon size={16} />}<span className="sr-only">{isNight ? "Switch to light mode" : "Switch to dark mode"}</span>
          </button>
          {variant === "journal" ? (
            <button
              type="button"
              className="nav-action nav-icon-button text-rose-700 hover:text-rose-900"
              onClick={handleLogoutClick}
              aria-label="Log out"
              data-tooltip="Log out"
            >
              <LogOut size={16} />
              <span className="sr-only">Log out</span>
            </button>
          ) : content.actionHref && ActionIcon ? (
            <Link href={content.actionHref} className="nav-action nav-icon-button" aria-label={content.actionLabel ?? undefined} data-tooltip={content.actionLabel ?? undefined}>
              <ActionIcon size={16} /><span className="sr-only">{content.actionLabel}</span>
            </Link>
          ) : null}
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            className="journal-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !isLoggingOut) setShowLogoutConfirm(false);
            }}
          >
            <motion.div
              className="journal-modal-card max-w-md p-6 sm:p-7 relative"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-dialog-title"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-rose-100 text-rose-600">
                    <LogOut size={20} />
                  </span>
                  <div>
                    <h3 id="logout-dialog-title" className="font-title text-2xl text-rose-950">
                      Sign out of Momenta?
                    </h3>
                    <p className="mt-1 text-xs text-rose-900/60">EST. US · Shared Journal</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={isLoggingOut}
                  className="journal-close"
                  aria-label="Close dialog"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="mt-4 text-sm leading-6 text-rose-900/80">
                Your memories and reflections are safely kept. You will need to sign back in with your account to access your shared journal.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={isLoggingOut}
                  className="rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-900 hover:bg-rose-50 transition"
                >
                  Stay in journal
                </button>
                <button
                  type="button"
                  onClick={confirmLogout}
                  disabled={isLoggingOut}
                  className="primary-button text-xs py-2 px-5 inline-flex items-center gap-2"
                >
                  <LogOut size={14} />
                  {isLoggingOut ? "Signing out…" : "Yes, sign out"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
