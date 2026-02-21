"use client";

import { motion } from "framer-motion";
import { useVisualSystem } from "@/components/visual-system-provider";

type ProgressBarProps = {
  value: number;
  label?: string;
  showValue?: boolean;
  className?: string;
};

export function ProgressBar({ value, label, showValue = true, className = "" }: ProgressBarProps) {
  const { profile } = useVisualSystem();
  const normalized = Math.max(0, Math.min(1, (value + 1) / 2));
  const reduced = profile.motionSystem.reducedMotion;

  return (
    <div className={`space-y-2 ${className}`}>
      {label ? (
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.15em] text-[var(--color-surface)]/80">
          <span>{label}</span>
          {showValue ? <span>{value.toFixed(3)}</span> : null}
        </div>
      ) : null}
      <div
        className="relative h-3 overflow-hidden rounded-full"
        style={{
          background: "color-mix(in oklab, var(--color-surface) 24%, black 76%)",
          border: "1px solid color-mix(in oklab, var(--color-surface) 26%, transparent)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <motion.div
          className="absolute inset-0 origin-left"
          initial={false}
          animate={{ scaleX: normalized }}
          transition={{
            type: reduced ? "tween" : "spring",
            duration: reduced ? 0.01 : undefined,
            stiffness: 170 + profile.motionSystem.elasticity * 160,
            damping: 26,
          }}
          style={{
            transformOrigin: "left center",
            background: "linear-gradient(90deg, #89ff9d, #4cd964)",
            boxShadow: "0 0 14px color-mix(in oklab, #89ff9d 45%, transparent)",
          }}
        />
        {!reduced ? (
          <motion.div
            className="absolute inset-y-0 w-10"
            animate={{
              x: ["-120%", "260%"],
              opacity: [0, 0.26, 0],
            }}
            transition={{
              duration: 2.8 / profile.motionSystem.speed,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.38) 50%, transparent 100%)",
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
