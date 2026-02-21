"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useVisualSystem } from "@/components/visual-system-provider";

type CardProps = {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  glow?: boolean;
};

export function Card({ children, className = "", hoverable = true, glow = true }: CardProps) {
  const { profile } = useVisualSystem();
  const panelMix = Math.round(22 + profile.depthSystem.glassAlpha * 26);
  return (
    <motion.section
      className={`relative overflow-hidden ${className}`}
      style={{
        isolation: "isolate",
        background: `color-mix(in oklab, var(--color-surface) ${panelMix}%, var(--color-bg))`,
        border: "1px solid color-mix(in oklab, var(--color-surface) 22%, transparent)",
        borderRadius: "var(--radius-lg)",
        boxShadow:
          profile.behavior.reverseSensitivity > 0.55
            ? "0 14px 32px rgba(0, 0, 0, 0.28), var(--shadow-split)"
            : "var(--shadow-soft)",
        backdropFilter: `blur(var(--blur-amount))`,
        overflow: "hidden",
      }}
      whileHover={
        hoverable && !profile.motionSystem.reducedMotion
          ? {
              y: -4 * profile.motionSystem.floatIntensity,
              scale: 1.004,
            }
          : undefined
      }
      transition={{
        type: "spring",
        damping: 24,
        stiffness: 220,
      }}
    >
      {glow ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-18"
          style={{
            background:
              "radial-gradient(circle at 24% 0%, color-mix(in oklab, var(--color-glow) 16%, transparent) 0%, transparent 62%)",
            filter: "blur(20px)",
          }}
        />
      ) : null}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      />
      <div className="relative">{children}</div>
    </motion.section>
  );
}
