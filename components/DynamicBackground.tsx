"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ParticleField } from "@/components/ParticleField";
import type { VisualProfile } from "@/lib/visual-system";

type DynamicBackgroundProps = {
  profile: VisualProfile;
};

function resolveGradient(profile: VisualProfile) {
  if (profile.colorSystem.splitMode === "linear") {
    return `linear-gradient(118deg, ${profile.colorSystem.gradientA} 0%, ${profile.colorSystem.gradientB} 52%, ${profile.colorSystem.gradientC} 100%)`;
  }
  if (profile.colorSystem.splitMode === "radial") {
    return `radial-gradient(circle at 20% 12%, ${profile.colorSystem.gradientA} 0%, transparent 42%), radial-gradient(circle at 80% 14%, ${profile.colorSystem.gradientC} 0%, transparent 38%), ${profile.colorSystem.bg}`;
  }
  return `linear-gradient(136deg, ${profile.colorSystem.gradientA} 0%, ${profile.colorSystem.gradientB} 52%, ${profile.colorSystem.gradientC} 100%)`;
}

export function DynamicBackground({ profile }: DynamicBackgroundProps) {
  const pathname = usePathname();
  const flowDuration = profile.backgroundSystem.flowDuration / profile.motionSystem.speed;
  const reduced = profile.motionSystem.reducedMotion;
  const disableParticles = pathname === "/test/new";

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute inset-[-20%]"
        style={{
          background: resolveGradient(profile),
          opacity: 0.18,
          filter: `blur(${profile.backgroundSystem.glowBlur}px) saturate(102%)`,
        }}
        animate={
          reduced
            ? undefined
            : {
                rotate: [0, profile.motionSystem.chaosLevel * 6, 0],
                scale: [1, 1.04, 1],
                x: ["0%", "1.5%", "-1.2%", "0%"],
                y: ["0%", "-1.4%", "1.1%", "0%"],
              }
        }
        transition={
          reduced
            ? undefined
            : {
                duration: flowDuration,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }
        }
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 38%, rgba(255,255,255,0.03) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 52% -4%, color-mix(in oklab, var(--color-glow) 22%, transparent) 0%, transparent 64%)",
          opacity: 0.5,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 100%, color-mix(in oklab, var(--color-primary) 14%, transparent) 0%, transparent 52%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0, 0, 0, 0.24)" }}
      />
      <div
        className="absolute inset-0 opacity-[var(--noise-opacity,0.06)]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.08) 0.6px, transparent 0.7px)",
          backgroundSize: "3px 3px",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.045) 0, rgba(255,255,255,0.045) 1px, transparent 1px, transparent 3px), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 4px)",
        }}
      />
      {!disableParticles ? <ParticleField profile={profile} /> : null}
    </div>
  );
}
