import type { StyleProfile, TraitVector } from "@/lib/avatar-line/types";

export const STYLE_PROFILES: StyleProfile[] = [
  {
    id: "KawaiiMinimal",
    strokeScale: 1.02,
    wobbleFactor: 0.08,
    eyeBoost: 0.1,
    roundBoost: 0.12,
    simplicityBias: 0.16,
    decorationDensity: 0.2,
  },
  {
    id: "SketchWobble",
    strokeScale: 1.08,
    wobbleFactor: 0.52,
    eyeBoost: 0.04,
    roundBoost: 0.05,
    simplicityBias: -0.08,
    decorationDensity: 0.46,
  },
  {
    id: "GeometricCute",
    strokeScale: 1.14,
    wobbleFactor: 0.04,
    eyeBoost: 0.06,
    roundBoost: -0.1,
    simplicityBias: 0.08,
    decorationDensity: 0.34,
  },
  {
    id: "MangaChibi",
    strokeScale: 0.98,
    wobbleFactor: 0.16,
    eyeBoost: 0.22,
    roundBoost: 0.04,
    simplicityBias: -0.04,
    decorationDensity: 0.58,
  },
  {
    id: "NotebookDoodle",
    strokeScale: 0.9,
    wobbleFactor: 0.32,
    eyeBoost: 0.06,
    roundBoost: 0.08,
    simplicityBias: -0.12,
    decorationDensity: 0.66,
  },
  {
    id: "SoftTechLine",
    strokeScale: 0.88,
    wobbleFactor: 0.04,
    eyeBoost: 0.08,
    roundBoost: 0.02,
    simplicityBias: 0.2,
    decorationDensity: 0.42,
  },
];

type WeightedItem = {
  id: StyleProfile["id"];
  weight: number;
};

export function selectStyleProfile(traits: TraitVector, rng: () => number): StyleProfile {
  const weighted: WeightedItem[] = [
    { id: "KawaiiMinimal", weight: 0.9 + traits.simplicity + traits.roundness + traits.calm * 0.3 },
    { id: "SketchWobble", weight: 0.4 + traits.wobble * 1.2 + traits.energy * 0.6 },
    { id: "GeometricCute", weight: 0.4 + traits.order * 0.9 + traits.tech * 0.3 },
    { id: "MangaChibi", weight: 0.5 + traits.eye_size * 1.1 + traits.smile * 0.5 + traits.energy * 0.4 },
    { id: "NotebookDoodle", weight: 0.35 + (1 - traits.simplicity) * 0.8 + traits.openness * 0.4 },
    { id: "SoftTechLine", weight: 0.45 + traits.tech * 1.1 + traits.order * 0.45 + traits.simplicity * 0.2 },
  ];

  const sum = weighted.reduce((acc, item) => acc + item.weight, 0);
  let cursor = rng() * sum;
  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor <= 0) {
      return STYLE_PROFILES.find((style) => style.id === item.id) ?? STYLE_PROFILES[0];
    }
  }
  return STYLE_PROFILES[STYLE_PROFILES.length - 1];
}

export function getStyleProfileById(id: StyleProfile["id"]) {
  return STYLE_PROFILES.find((item) => item.id === id) ?? STYLE_PROFILES[0];
}

