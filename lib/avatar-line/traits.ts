import { clamp } from "@/lib/math";
import { mapAnswersToTraitDeltas } from "@/lib/avatar-line/mapping";
import type { AvatarAnswerInput, TraitVector } from "@/lib/avatar-line/types";

const TRAIT_KEYS: Array<keyof TraitVector> = [
  "chibi",
  "eye_size",
  "cheek",
  "smile",
  "roundness",
  "stroke_weight",
  "wobble",
  "simplicity",
  "energy",
  "openness",
  "calm",
  "tech",
  "nature",
  "mystic",
  "order",
];

export function clamp01(value: number) {
  return clamp(value, 0, 1);
}

function baseTraitsByMbti(mbti: string): TraitVector {
  const text = mbti.toUpperCase();
  const letters = {
    EI: text[0] === "E" ? 1 : 0,
    SN: text[1] === "N" ? 1 : 0,
    TF: text[2] === "F" ? 1 : 0,
    JP: text[3] === "J" ? 1 : 0,
  };

  return {
    chibi: 0.56 + letters.TF * 0.08 - letters.EI * 0.04,
    eye_size: 0.5 + letters.TF * 0.16 + letters.SN * 0.1,
    cheek: 0.45 + letters.TF * 0.18 - letters.JP * 0.08,
    smile: 0.48 + letters.EI * 0.16 + letters.TF * 0.1,
    roundness: 0.54 + letters.TF * 0.18 - letters.JP * 0.1,
    stroke_weight: 0.46 + letters.JP * 0.16 - letters.SN * 0.08,
    wobble: 0.35 + letters.SN * 0.16 + letters.EI * 0.08,
    simplicity: 0.46 + letters.JP * 0.14 - letters.SN * 0.1,
    energy: 0.42 + letters.EI * 0.32,
    openness: 0.36 + letters.EI * 0.22 + letters.SN * 0.2,
    calm: 0.48 + (1 - letters.EI) * 0.2 + letters.JP * 0.1,
    tech: 0.34 + (1 - letters.TF) * 0.2 + letters.JP * 0.12,
    nature: 0.34 + letters.TF * 0.2 + (1 - letters.JP) * 0.08,
    mystic: 0.26 + letters.SN * 0.26 + letters.TF * 0.1,
    order: 0.34 + letters.JP * 0.32 + (1 - letters.SN) * 0.08,
  };
}

export function normalizeTraitVector(partial: Partial<TraitVector>): TraitVector {
  const out = {} as TraitVector;
  TRAIT_KEYS.forEach((key) => {
    out[key] = clamp01(Number(partial[key] ?? 0.5));
  });
  return out;
}

export function buildTraitVector(mbti: string, answers: AvatarAnswerInput[]): TraitVector {
  const base = baseTraitsByMbti(mbti);
  const deltas = mapAnswersToTraitDeltas(answers);

  const merged: Partial<TraitVector> = { ...base };
  TRAIT_KEYS.forEach((key) => {
    merged[key] = clamp01((base[key] ?? 0.5) + (deltas[key] ?? 0));
  });

  // Cute constraints hard rules.
  merged.chibi = clamp01(merged.chibi ?? 0.55);
  merged.eye_size = clamp01((merged.eye_size ?? 0.5) * 0.9 + (merged.chibi ?? 0.55) * 0.1);
  merged.roundness = clamp01((merged.roundness ?? 0.55) * 0.85 + 0.08);
  merged.simplicity = clamp01(merged.simplicity ?? 0.5);

  return normalizeTraitVector(merged);
}

