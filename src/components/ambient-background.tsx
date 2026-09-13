"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

export function AmbientBackground() {
  const prefersReducedMotion = useReducedMotion();
  const pointerX = useMotionValue(50);
  const pointerY = useMotionValue(45);
  const smoothX = useSpring(pointerX, { stiffness: 55, damping: 24 });
  const smoothY = useSpring(pointerY, { stiffness: 55, damping: 24 });
  const rotateX = useTransform(smoothY, [0, 100], [-5, 5]);
  const rotateY = useTransform(smoothX, [0, 100], [7, -7]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const updatePointer = (event: MouseEvent) => {
      pointerX.set((event.clientX / window.innerWidth) * 100);
      pointerY.set((event.clientY / window.innerHeight) * 100);
    };
    window.addEventListener("mousemove", updatePointer);
    return () => window.removeEventListener("mousemove", updatePointer);
  }, [pointerX, pointerY, prefersReducedMotion]);

  return <div className="ambient-background" aria-hidden="true"><motion.div className="ambient-stage" style={prefersReducedMotion ? undefined : { rotateX, rotateY }}><div className="ambient-plane" /><div className="ambient-orb ambient-orb-one" /><div className="ambient-orb ambient-orb-two" /><div className="ambient-ring" /></motion.div></div>;
}
