"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import type { VisualProfile } from "@/lib/visual-system";

type ParticleFieldProps = {
  profile: VisualProfile;
};

function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function createDots(count: number, seedKey: string) {
  const random = mulberry32(hashString(seedKey));
  return Array.from({ length: count }, () => ({
    x: random() * 100,
    y: random() * 100,
    size: random() * 3 + 1,
    duration: 6 + random() * 12,
    delay: random() * 4,
  }));
}

export const ParticleField = memo(function ParticleField({ profile }: ParticleFieldProps) {
  const reduced = profile.motionSystem.reducedMotion;
  const count = reduced ? Math.min(16, Math.floor(profile.backgroundSystem.particleDensity / 3)) : profile.backgroundSystem.particleDensity;
  const seedKey = [
    count,
    profile.evolution.generation,
    profile.evolution.driftHue.toFixed(3),
    profile.motionSystem.chaosLevel.toFixed(3),
    profile.motionSystem.floatIntensity.toFixed(3),
    profile.backgroundSystem.particleDensity,
  ].join("|");
  const dots = useMemo(() => createDots(count, seedKey), [count, seedKey]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((dot, index) => (
        <motion.span
          key={`${dot.x}-${dot.y}-${index}`}
          className="absolute rounded-full"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.size,
            height: dot.size,
            background: "var(--color-glow)",
            opacity: 0.18,
            filter: "blur(0.4px)",
          }}
          animate={
            reduced
              ? undefined
              : {
                  y: [0, -10 - profile.motionSystem.floatIntensity * 16, 0],
                  x: [0, profile.motionSystem.chaosLevel * 14 - 7, 0],
                  opacity: [0.14, 0.34, 0.14],
                }
          }
          transition={
            reduced
              ? undefined
              : {
                  duration: dot.duration / profile.motionSystem.speed,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: dot.delay,
                }
          }
        />
      ))}
    </div>
  );
});
