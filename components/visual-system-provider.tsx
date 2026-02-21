"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { MotionConfig, useReducedMotion } from "framer-motion";
import { DynamicBackground } from "@/components/DynamicBackground";
import { mapStyleDNAToVisualProfile, type VisualProfile } from "@/lib/visual-system";
import type { BehaviorStats, DimensionScores, StyleDNA } from "@/lib/types";

type VisualSystemProviderProps = {
  styleDNA: StyleDNA | null;
  behaviorStats?: Partial<BehaviorStats> | null;
  latestScores?: Partial<DimensionScores> | null;
  tokenCount?: number;
  children: ReactNode;
};

type VisualContextValue = {
  profile: VisualProfile;
};

const VisualSystemContext = createContext<VisualContextValue | null>(null);

function toCssVars(profile: VisualProfile) {
  return {
    "--color-primary": profile.colorSystem.primary,
    "--color-secondary": profile.colorSystem.secondary,
    "--color-accent": profile.colorSystem.accent,
    "--color-bg": profile.colorSystem.bg,
    "--color-surface": profile.colorSystem.surface,
    "--color-glow": profile.colorSystem.glow,
    "--gradient-a": profile.colorSystem.gradientA,
    "--gradient-b": profile.colorSystem.gradientB,
    "--gradient-c": profile.colorSystem.gradientC,
    "--radius-sm": profile.shapeSystem.radiusSm,
    "--radius-md": profile.shapeSystem.radiusMd,
    "--radius-lg": profile.shapeSystem.radiusLg,
    "--clip-panel": profile.shapeSystem.clipPath,
    "--surface-border": profile.shapeSystem.borderStyle,
    "--shadow-soft": profile.depthSystem.shadowSoft,
    "--shadow-strong": profile.depthSystem.shadowStrong,
    "--shadow-split": profile.depthSystem.shadowSplit,
    "--glass-alpha": `${profile.depthSystem.glassAlpha}`,
    "--blur-amount": profile.depthSystem.blurAmount,
    "--tracking-main": profile.typographySystem.bodySpacing,
    "--tracking-heading": profile.typographySystem.letterSpacing,
    "--flow-duration": `${profile.backgroundSystem.flowDuration}s`,
    "--noise-opacity": `${profile.backgroundSystem.noiseOpacity}`,
    "--font-main":
      profile.typographySystem.fontFamily === "geo"
        ? "var(--font-geo), sans-serif"
        : "var(--font-soft), sans-serif",
    "--motion-speed": `${profile.motionSystem.speed}`,
    "--float-intensity": `${profile.motionSystem.floatIntensity}`,
  } as Record<string, string>;
}

export function VisualSystemProvider({
  styleDNA,
  behaviorStats,
  latestScores,
  tokenCount,
  children,
}: VisualSystemProviderProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const profile = useMemo(
    () =>
      mapStyleDNAToVisualProfile({
        styleDNA,
        behaviorStats,
        latestScores,
        tokenCount,
        reducedMotion,
      }),
    [styleDNA, behaviorStats, latestScores, tokenCount, reducedMotion],
  );

  useEffect(() => {
    const vars = toCssVars(profile);
    const root = document.documentElement;
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    root.dataset.splitMode = profile.colorSystem.splitMode;
    root.dataset.shape = styleDNA?.silhouette ?? "balanced";
    return () => {
      Object.keys(vars).forEach((key) => {
        root.style.removeProperty(key);
      });
      delete root.dataset.splitMode;
      delete root.dataset.shape;
    };
  }, [profile, styleDNA?.silhouette]);

  const transition = useMemo(
    () => ({
      duration: 0.45 / profile.motionSystem.speed,
      ease: profile.motionSystem.easing as [number, number, number, number],
    }),
    [profile.motionSystem.easing, profile.motionSystem.speed],
  );

  return (
    <VisualSystemContext.Provider value={{ profile }}>
      <MotionConfig reducedMotion={profile.motionSystem.reducedMotion ? "always" : "never"} transition={transition}>
        <DynamicBackground profile={profile} />
        <div className="relative z-10">{children}</div>
      </MotionConfig>
    </VisualSystemContext.Provider>
  );
}

export function useVisualSystem() {
  const context = useContext(VisualSystemContext);
  if (!context) {
    throw new Error("useVisualSystem must be used inside VisualSystemProvider");
  }
  return context;
}
