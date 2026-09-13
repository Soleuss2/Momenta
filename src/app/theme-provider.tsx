"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";

type ThemeContextValue = {
  isNight: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const themeKey = "our-journal-theme";

function subscribeToTheme(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("our-journal-theme-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("our-journal-theme-change", onChange);
  };
}

function getThemeSnapshot() {
  return window.localStorage.getItem(themeKey) === "night";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const isNight = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => false);

  useEffect(() => {
    document.documentElement.dataset.theme = isNight ? "night" : "light";
  }, [isNight]);

  const toggleTheme = () => {
    window.localStorage.setItem(themeKey, isNight ? "light" : "night");
    window.dispatchEvent(new Event("our-journal-theme-change"));
  };

  return <ThemeContext.Provider value={{ isNight, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
