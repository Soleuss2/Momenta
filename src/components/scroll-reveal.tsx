"use client";

import { motion, useReducedMotion, type MotionProps } from "framer-motion";
import type { ReactNode } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
};

export function ScrollReveal({ children, className, delay = 0, direction = "up" }: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const offset = direction === "up" ? { y: 28 } : { x: direction === "left" ? -28 : 28 };
  const visible = direction === "up" ? { y: 0 } : { x: 0 };
  const motionProps: MotionProps = prefersReducedMotion ? {} : {
    initial: { opacity: 0, ...offset },
    whileInView: { opacity: 1, ...visible },
    viewport: { once: false, amount: 0.2 },
    transition: { duration: 0.55, delay, ease: "easeOut" },
  };

  return <motion.div className={className} {...motionProps}>{children}</motion.div>;
}
