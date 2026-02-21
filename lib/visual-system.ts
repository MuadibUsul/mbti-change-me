import { clamp, round } from "@/lib/math";
import type { BehaviorStats, Dimension, DimensionScores, HSLColor, StyleDNA } from "@/lib/types";

export type MotionSystem = {
  speed: number;
  easing: number[];
  chaosLevel: number;
  elasticity: number;
  floatIntensity: number;
  reducedMotion: boolean;
};

export type VisualProfile = {
  colorSystem: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    surface: string;
    glow: string;
    gradientA: string;
    gradientB: string;
    gradientC: string;
    splitMode: "none" | "radial" | "linear";
  };
  motionSystem: MotionSystem;
  shapeSystem: {
    radiusSm: string;
    radiusMd: string;
    radiusLg: string;
    clipPath: string;
    borderStyle: string;
  };
  depthSystem: {
    shadowSoft: string;
    shadowStrong: string;
    shadowSplit: string;
    blurAmount: string;
    glassAlpha: number;
  };
  typographySystem: {
    fontFamily: "geo" | "soft";
    headingStretch: number;
    letterSpacing: string;
    bodySpacing: string;
  };
  backgroundSystem: {
    particleDensity: number;
    glowBlur: number;
    flowDuration: number;
    noiseOpacity: number;
  };
  behavior: Required<BehaviorStats>;
  evolution: {
    driftHue: number;
    generation: number;
  };
};

type VisualInput = {
  styleDNA: StyleDNA | null;
  behaviorStats?: Partial<BehaviorStats> | null;
  latestScores?: Partial<DimensionScores> | null;
  tokenCount?: number;
  reducedMotion?: boolean;
};

const DEFAULT_PALETTE: HSLColor[] = [
  { h: 24, s: 78, l: 58 },
  { h: 168, s: 58, l: 46 },
  { h: 346, s: 70, l: 61 },
  { h: 38, s: 56, l: 44 },
];

const DEFAULT_BEHAVIOR: Required<BehaviorStats> = {
  extremity: 0.5,
  consistency: 0.5,
  neutrality: 0.3,
  reverseSensitivity: 0.25,
  completionPace: 0.5,
};

const DEFAULT_SCORES: DimensionScores = {
  EI: 0,
  SN: 0,
  TF: 0,
  JP: 0,
};

function hslToCss(color: HSLColor) {
  return `hsl(${round(color.h, 2)} ${round(color.s, 2)}% ${round(color.l, 2)}%)`;
}

function withHueShift(color: HSLColor, shift: number): HSLColor {
  return {
    h: (color.h + shift + 360) % 360,
    s: color.s,
    l: color.l,
  };
}

function mixLightness(color: HSLColor, delta: number): HSLColor {
  return { ...color, l: clamp(color.l + delta, 8, 94) };
}

function mixSaturation(color: HSLColor, delta: number): HSLColor {
  return { ...color, s: clamp(color.s + delta, 8, 96) };
}

function resolveBehavior(stats?: Partial<BehaviorStats> | null): Required<BehaviorStats> {
  return {
    extremity: clamp(stats?.extremity ?? DEFAULT_BEHAVIOR.extremity, 0, 1),
    consistency: clamp(stats?.consistency ?? DEFAULT_BEHAVIOR.consistency, 0, 1),
    neutrality: clamp(stats?.neutrality ?? DEFAULT_BEHAVIOR.neutrality, 0, 1),
    reverseSensitivity: clamp(
      stats?.reverseSensitivity ?? DEFAULT_BEHAVIOR.reverseSensitivity,
      0,
      1,
    ),
    completionPace: clamp(stats?.completionPace ?? DEFAULT_BEHAVIOR.completionPace, 0, 1),
  };
}

function resolveScores(scores?: Partial<DimensionScores> | null): DimensionScores {
  return {
    EI: clamp(scores?.EI ?? DEFAULT_SCORES.EI, -1, 1),
    SN: clamp(scores?.SN ?? DEFAULT_SCORES.SN, -1, 1),
    TF: clamp(scores?.TF ?? DEFAULT_SCORES.TF, -1, 1),
    JP: clamp(scores?.JP ?? DEFAULT_SCORES.JP, -1, 1),
  };
}

function createPalette(styleDNA: StyleDNA | null, behavior: Required<BehaviorStats>, driftHue: number) {
  const seedPalette = styleDNA?.basePalette?.length ? styleDNA.basePalette : DEFAULT_PALETTE;
  const saturated = seedPalette.map((color) =>
    mixSaturation(color, behavior.extremity * 7 - behavior.neutrality * 18),
  );
  return saturated.map((color, index) =>
    mixLightness(withHueShift(color, driftHue + index * 1.2), behavior.consistency * 5 - 1),
  );
}

function typographyFamily(scores: DimensionScores) {
  return scores.TF >= 0 ? "geo" : "soft";
}

function clipPathBySilhouette(shape: StyleDNA["silhouette"] | undefined) {
  if (shape === "sharp") {
    return "polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px))";
  }
  if (shape === "balanced") {
    return "polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))";
  }
  return "inset(0 round var(--radius-lg))";
}

export function mapStyleDNAToVisualProfile(input: VisualInput): VisualProfile {
  const tokenCount = Math.max(0, input.tokenCount ?? 0);
  const behavior = resolveBehavior(input.behaviorStats);
  const scores = resolveScores(input.latestScores);
  const generation = Math.max(1, tokenCount || 1);

  // Small evolution drift after each session, preserving identity.
  const driftHue = round(((generation - 1) % 9) * 0.9 + scores.EI * 2.8 - scores.SN * 1.6, 2);
  const palette = createPalette(input.styleDNA, behavior, driftHue);
  const [primary, secondary, accent] = palette;

  const contrastBoost = behavior.extremity * 18;
  const neutralDamp = behavior.neutrality * 18;
  const splitMode =
    behavior.reverseSensitivity > 0.62 ? "linear" : behavior.reverseSensitivity > 0.45 ? "radial" : "none";

  const primaryColor = hslToCss(mixLightness(primary, contrastBoost * 0.04 + 4));
  const secondaryColor = hslToCss(mixLightness(secondary, -contrastBoost * 0.03 + 2));
  const accentColor = hslToCss(mixSaturation(mixLightness(accent, contrastBoost * 0.015 + 3), 8));
  const bgColor = hslToCss({
    h: (22 + driftHue + 360) % 360,
    s: clamp(34 - neutralDamp * 0.35, 18, 42),
    l: clamp(14 + behavior.neutrality * 6 + behavior.consistency * 3, 12, 24),
  });
  const surfaceColor = hslToCss({
    h: 40,
    s: clamp(34 - neutralDamp * 0.24, 22, 42),
    l: clamp(95 - behavior.extremity * 2.5, 92, 98),
  });
  const glowColor = hslToCss(mixSaturation(mixLightness(accent, 10), 10));

  const radiusFactor =
    input.styleDNA?.silhouette === "round"
      ? 1
      : input.styleDNA?.silhouette === "sharp"
        ? 0.35
        : 0.62;

  const shapeRadius = {
    radiusSm: `${round(16 * radiusFactor + 3, 2)}px`,
    radiusMd: `${round(24 * radiusFactor + 5, 2)}px`,
    radiusLg: `${round(38 * radiusFactor + 7, 2)}px`,
  };

  const speedBase = clamp(0.96 - behavior.neutrality * 0.3 + behavior.extremity * 0.32, 0.68, 1.35);
  const motionSystem: MotionSystem = {
    speed: input.reducedMotion ? 0.65 : round(speedBase, 3),
    easing: [0.18, 0.78 - behavior.consistency * 0.22, 0.24 + behavior.extremity * 0.12, 1],
    chaosLevel: round(clamp(behavior.reverseSensitivity * 0.85 + (1 - behavior.consistency) * 0.32, 0, 1), 3),
    elasticity: round(clamp(0.2 + behavior.extremity * 0.32 - behavior.neutrality * 0.1, 0.16, 0.62), 3),
    floatIntensity: round(clamp(0.12 + behavior.extremity * 0.26 + (1 - behavior.consistency) * 0.16, 0.1, 0.65), 3),
    reducedMotion: Boolean(input.reducedMotion),
  };

  const shadowAlpha = 0.16 + behavior.extremity * 0.14;
  const splitShadowAlpha = 0.08 + behavior.reverseSensitivity * 0.14;

  return {
    colorSystem: {
      primary: primaryColor,
      secondary: secondaryColor,
      accent: accentColor,
      bg: bgColor,
      surface: surfaceColor,
      glow: glowColor,
      gradientA: hslToCss(mixSaturation(mixLightness(primary, 8), 6)),
      gradientB: hslToCss(mixSaturation(mixLightness(secondary, 6), 2)),
      gradientC: hslToCss(mixSaturation(mixLightness(accent, 8), 8)),
      splitMode,
    },
    motionSystem,
    shapeSystem: {
      ...shapeRadius,
      clipPath: clipPathBySilhouette(input.styleDNA?.silhouette),
      borderStyle: `1px solid color-mix(in oklab, ${primaryColor} 45%, white 55%)`,
    },
    depthSystem: {
      shadowSoft: `0 14px 30px rgba(0, 0, 0, ${round(shadowAlpha, 3)})`,
      shadowStrong: `0 30px 80px rgba(0, 0, 0, ${round(shadowAlpha + 0.12, 3)})`,
      shadowSplit: `-14px 0 26px rgba(0, 0, 0, ${round(
        splitShadowAlpha,
        3,
      )}), 14px 0 26px rgba(0, 0, 0, ${round(splitShadowAlpha, 3)})`,
      blurAmount: `${round(16 + behavior.neutrality * 18 + behavior.reverseSensitivity * 12, 1)}px`,
      glassAlpha: round(clamp(0.3 + behavior.neutrality * 0.08 - behavior.extremity * 0.04, 0.24, 0.46), 3),
    },
    typographySystem: {
      fontFamily: typographyFamily(scores),
      headingStretch: round(clamp(100 + scores.TF * 12 - scores.EI * 8, 88, 128), 2),
      letterSpacing: `${round(clamp(0.01 + scores.EI * 0.02 - (scores.EI < 0 ? 0.012 : 0), -0.01, 0.05), 3)}em`,
      bodySpacing: `${round(clamp(0.005 + scores.EI * 0.01, -0.004, 0.02), 3)}em`,
    },
    backgroundSystem: {
      particleDensity: Math.round(clamp(24 + behavior.extremity * 30 + behavior.reverseSensitivity * 18, 18, 72)),
      glowBlur: Math.round(clamp(18 + behavior.neutrality * 22 + behavior.reverseSensitivity * 24, 14, 72)),
      flowDuration: round(clamp(18 - behavior.extremity * 5 + behavior.neutrality * 8, 10, 28), 2),
      noiseOpacity: round(clamp(0.02 + (1 - behavior.consistency) * 0.04, 0.015, 0.08), 3),
    },
    behavior,
    evolution: {
      driftHue,
      generation,
    },
  };
}

export function scoreMapFromRows(rows: Array<{ dimension: string; normalizedScore: number }>) {
  const map: DimensionScores = { EI: 0, SN: 0, TF: 0, JP: 0 };
  rows.forEach((row) => {
    const key = row.dimension as Dimension;
    if (key in map) {
      map[key] = clamp(row.normalizedScore, -1, 1);
    }
  });
  return map;
}

export function parseBehaviorStats(raw: unknown): Partial<BehaviorStats> | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<BehaviorStats>;
  return {
    extremity: typeof value.extremity === "number" ? value.extremity : undefined,
    consistency: typeof value.consistency === "number" ? value.consistency : undefined,
    neutrality: typeof value.neutrality === "number" ? value.neutrality : undefined,
    reverseSensitivity:
      typeof value.reverseSensitivity === "number" ? value.reverseSensitivity : undefined,
    completionPace: typeof value.completionPace === "number" ? value.completionPace : undefined,
  };
}
