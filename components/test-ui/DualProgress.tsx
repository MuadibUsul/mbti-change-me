"use client";

import { motion } from "framer-motion";
import { useVisualSystem } from "@/components/visual-system-provider";

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

type BarProps = {
  label: string;
  value: number;
  subtle?: boolean;
};

function AdvancedBar({ label, value, subtle = false }: BarProps) {
  const { profile } = useVisualSystem();
  const reduced = profile.motionSystem.reducedMotion;
  const progress = clamp01(value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] tracking-[0.14em] text-[var(--color-surface)]/70">
        <span>{label}</span>
        <span>{Math.round(progress * 100)}%</span>
      </div>
      <div
        className="relative h-2 overflow-hidden rounded-full"
        style={{
          background: "color-mix(in oklab, var(--color-surface) 18%, black 82%)",
          border: "1px solid color-mix(in oklab, var(--color-surface) 20%, transparent)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <motion.div
          className="absolute inset-0 origin-left"
          initial={false}
          animate={{ scaleX: progress }}
          transition={
            reduced
              ? { duration: 0.01 }
              : {
                  duration: subtle ? 0.3 : 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }
          }
          style={{
            transformOrigin: "left center",
            background: "linear-gradient(90deg, #89ff9d, #4cd964)",
            boxShadow: "0 0 12px color-mix(in oklab, #89ff9d 36%, transparent)",
          }}
        />
        {!reduced ? (
          <motion.span
            className="pointer-events-none absolute inset-y-0 w-10"
            animate={{ x: ["-120%", "260%"], opacity: [0, 0.26, 0] }}
            transition={{
              duration: 2.6 / profile.motionSystem.speed,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.38), transparent)",
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

type DualProgressProps = {
  totalProgress: number;
  dimensionProgress: number;
  dimension: "EI" | "SN" | "TF" | "JP";
};

export function DualProgress({ totalProgress, dimensionProgress, dimension }: DualProgressProps) {
  return (
    <div className="space-y-3">
      <AdvancedBar label="Overall Progress" value={totalProgress} />
      <AdvancedBar label={`${dimension} Dimension`} value={dimensionProgress} subtle />
    </div>
  );
}
