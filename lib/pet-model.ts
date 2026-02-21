import seedrandom from "seedrandom";
import { clamp, round } from "@/lib/math";
import type { BehaviorStats, DimensionScores, PetModel, StyleDNA } from "@/lib/types";

type GeneratePetModelInput = {
  userId: string;
  sessionId: string;
  mbti: string;
  styleDNA: StyleDNA;
  scores: DimensionScores;
  behavior: BehaviorStats;
};

const PLACEHOLDER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" aria-hidden="true"><rect width="1" height="1" fill="transparent"/></svg>';

function hsl(h: number, s: number, l: number) {
  return `hsl(${Math.round(h)} ${Math.round(clamp(s, 0, 100))}% ${Math.round(clamp(l, 0, 100))}%)`;
}

function dimensionFeature(scores: DimensionScores): PetModel["featureTag"] {
  const items = (["EI", "SN", "TF", "JP"] as const).map((d) => ({ d, value: scores[d] }));
  const top = items.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0];
  if (top.d === "EI") return top.value >= 0 ? "social" : "introspective";
  if (top.d === "SN") return top.value >= 0 ? "grounded" : "visionary";
  if (top.d === "TF") return top.value >= 0 ? "logical" : "empathetic";
  return top.value >= 0 ? "structured" : "adaptive";
}

function speciesFromScores(scores: DimensionScores): PetModel["species"] {
  if (scores.SN < -0.45) return "sprite";
  if (scores.EI > 0.4) return "bunny";
  if (scores.TF < -0.35) return "cat";
  if (scores.JP < -0.35) return "fox";
  if (scores.SN > 0.42) return "bear";
  return "blob";
}

function moodFromScores(scores: DimensionScores, behavior: BehaviorStats): PetModel["mood"] {
  if (behavior.reverseSensitivity > 0.58) return "mysterious";
  if (scores.EI > 0.42) return "curious";
  if (scores.TF > 0.38) return "focused";
  if (scores.TF < -0.35) return "gentle";
  if (scores.JP > 0.35) return "bold";
  return "calm";
}

function eyeStyle(scores: DimensionScores, mood: PetModel["mood"]): PetModel["eyeStyle"] {
  if (mood === "curious") return "sparkle";
  if (mood === "gentle") return "smile";
  if (scores.TF > 0.42 || mood === "focused") return "focus";
  return "dot";
}

function accessoryFromStyle(styleDNA: StyleDNA, feature: PetModel["featureTag"]): PetModel["accessory"] {
  if (styleDNA.accessory === "halo") return "halo";
  if (styleDNA.accessory === "scarf") return "scarf";
  if (styleDNA.accessory === "antenna") return "leaf";
  if (styleDNA.accessory === "backpack") return "orb";
  if (feature === "logical") return "glasses";
  if (feature === "structured") return "headband";
  return "none";
}

function auraStyle(behavior: BehaviorStats, scores: DimensionScores): PetModel["auraStyle"] {
  if (behavior.extremity > 0.72) return "flame";
  if (behavior.reverseSensitivity > 0.5) return "sparkle";
  if (scores.EI > 0.35) return "ring";
  if (behavior.neutrality > 0.52) return "none";
  return "soft";
}

export function generatePetModel(input: GeneratePetModelInput): PetModel {
  const { styleDNA, scores, behavior, sessionId } = input;
  const seed = `${styleDNA.seed}:${sessionId}:pet3d`;
  const rng = seedrandom(seed);

  const featureTag = dimensionFeature(scores);
  const species = speciesFromScores(scores);
  const mood = moodFromScores(scores, behavior);
  const eye = eyeStyle(scores, mood);
  const accessory = accessoryFromStyle(styleDNA, featureTag);
  const aura = auraStyle(behavior, scores);

  const headScale = round(clamp(1.05 + (1 - Math.abs(scores.TF)) * 0.22 + behavior.neutrality * 0.12, 0.95, 1.38), 3);
  const bodyScale = round(clamp(0.94 + Math.abs(scores.JP) * 0.18 - behavior.neutrality * 0.06, 0.86, 1.28), 3);
  const limbScale = round(clamp(0.9 + behavior.extremity * 0.2 + (rng() - 0.5) * 0.08, 0.82, 1.22), 3);
  const eyeScale = round(clamp(0.86 + (scores.EI + 1) * 0.15 + behavior.neutrality * 0.08, 0.72, 1.34), 3);

  const base0 = styleDNA.basePalette[0] ?? { h: 200, s: 50, l: 50 };
  const base1 = styleDNA.basePalette[1] ?? { h: 120, s: 50, l: 50 };
  const base2 = styleDNA.basePalette[2] ?? { h: 20, s: 60, l: 52 };
  const base3 = styleDNA.basePalette[3] ?? { h: 300, s: 50, l: 50 };

  const bodyHue = (base1.h * 0.45 + base2.h * 0.35 + base0.h * 0.2 + rng() * 18) % 360;
  const accentHue = (base3.h + rng() * 24) % 360;
  const skinHue = (24 + (1 - (scores.TF + 1) / 2) * 10 + rng() * 6) % 360;
  const auraHue = (base0.h + (scores.EI > 0 ? 18 : -18) + rng() * 12 + 360) % 360;

  return {
    seed,
    species,
    mood,
    featureTag,
    eyeStyle: eye,
    eyeScale,
    headScale,
    bodyScale,
    limbScale,
    accessory,
    auraStyle: aura,
    palette: {
      skin: hsl(skinHue, 46 - behavior.neutrality * 10, 72 - behavior.extremity * 6),
      body: hsl(bodyHue, 58 - behavior.neutrality * 14, 52 - behavior.extremity * 4),
      accent: hsl(accentHue, 66 - behavior.neutrality * 12, 56),
      aura: hsl(auraHue, 72 - behavior.neutrality * 10, 60 - behavior.extremity * 4),
      line: hsl(base2.h + 4, 18, 15),
    },
  };
}

export function parsePetModel(raw: unknown): PetModel | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (typeof value.seed !== "string") return null;
  if (typeof value.species !== "string") return null;
  if (typeof value.mood !== "string") return null;
  return raw as PetModel;
}

export const PET_PLACEHOLDER_SVG = PLACEHOLDER_SVG;

