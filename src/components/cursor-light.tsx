"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { useTheme } from "../app/theme-provider";

export function CursorLight() {
  const { isNight } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const pointerX = useMotionValue(50);
  const pointerY = useMotionValue(42);
  const smoothX = useSpring(pointerX, { stiffness: 65, damping: 24, mass: 0.7 });
  const smoothY = useSpring(pointerY, { stiffness: 65, damping: 24, mass: 0.7 });
  const left = useTransform(smoothX, (value) => `${value}%`);
  const top = useTransform(smoothY, (value) => `${value}%`);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const updatePointer = (event: MouseEvent) => {
      pointerX.set((event.clientX / window.innerWidth) * 100);
      pointerY.set((event.clientY / window.innerHeight) * 100);
    };
    window.addEventListener("mousemove", updatePointer);
    return () => window.removeEventListener("mousemove", updatePointer);
  }, [pointerX, pointerY, prefersReducedMotion]);

  return <motion.div aria-hidden="true" className={`cursor-light ${isNight ? "is-night" : ""}`} style={prefersReducedMotion ? { left: "50%", top: "42%" } : { left, top }} />;
}
