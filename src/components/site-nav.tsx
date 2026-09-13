"use client";

import { ArrowLeft, BookHeart, CalendarDays, Heart, ImagePlus, LogIn, LogOut, Moon, NotebookPen, Settings2, Sparkles, Sun, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { MouseEvent } from "react";
import { useTheme } from "../app/theme-provider";

type SiteNavProps = {
  variant: "public" | "auth" | "journal";
};

type NavLink = { href: string; label: string; icon: LucideIcon };
type NavContent = { homeHref: string; actionHref: string | null; actionLabel: string | null; actionIcon: LucideIcon | null; links: NavLink[] };

const navContent = {
  public: { homeHref: "/public", actionHref: "/public/auth", actionLabel: "Sign in", actionIcon: LogIn, links: [{ href: "/public#why", label: "Why it matters", icon: BookHeart }, { href: "/public#story", label: "Our story", icon: Heart }] },
  auth: { homeHref: "/public", actionHref: "/public", actionLabel: "Back to home", actionIcon: ArrowLeft, links: [] },
  journal: { homeHref: "/users", actionHref: "/public", actionLabel: "Log out", actionIcon: LogOut, links: [{ href: "/users", label: "Memories", icon: BookHeart }, { href: "/users/capture", label: "Capture", icon: ImagePlus }, { href: "/users/studio", label: "Studio", icon: Sparkles }, { href: "/users/calendar", label: "Calendar", icon: CalendarDays }, { href: "/users/diary", label: "Diary", icon: NotebookPen }, { href: "/users/settings", label: "Settings", icon: Settings2 }] },
} satisfies Record<SiteNavProps["variant"], NavContent>;

export function SiteNav({ variant }: SiteNavProps) {
  const { isNight, toggleTheme } = useTheme();
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

  return (
    <nav className={variant === "journal" ? "journal-nav" : "site-nav"}>
      <Link href={content.homeHref} className="flex items-center gap-2 text-rose-950" aria-label="Momenta home">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-rose-500 text-white"><Heart size={17} fill="currentColor" /></span>
        <span className="font-title text-xl font-semibold">Momenta</span>
      </Link>
      <div className="nav-tools">
        <div className={variant === "journal" ? "nav-links journal-links" : "hidden items-center gap-8 text-sm font-medium text-rose-900/70 sm:flex"}>
          {content.links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={(event) => handleSectionClick(event, href)} className="nav-link nav-icon-button" aria-label={label} data-tooltip={label}><Icon size={16} /><span className="sr-only">{label}</span></Link>)}
        </div>
        <button type="button" className="theme-toggle nav-icon-button" onClick={toggleTheme} aria-label={isNight ? "Switch to light mode" : "Switch to dark mode"} data-tooltip={isNight ? "Light mode" : "Dark mode"}>{isNight ? <Sun size={16} /> : <Moon size={16} />}<span className="sr-only">{isNight ? "Switch to light mode" : "Switch to dark mode"}</span></button>
        {content.actionHref && ActionIcon ? <Link href={content.actionHref} className="nav-action nav-icon-button" aria-label={content.actionLabel ?? undefined} data-tooltip={content.actionLabel ?? undefined}><ActionIcon size={16} /><span className="sr-only">{content.actionLabel}</span></Link> : null}
      </div>
    </nav>
  );
}
