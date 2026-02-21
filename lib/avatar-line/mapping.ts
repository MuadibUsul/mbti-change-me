import { clamp } from "@/lib/math";
import { hash32, normalizeAnswers } from "@/lib/avatar-line/seed";
import type { AvatarAnswerInput, NormalizedAvatarAnswer, TraitVector } from "@/lib/avatar-line/types";

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

function optionToSignedValue(option: string): number {
  const asNumber = Number(option);
  if (Number.isFinite(asNumber) && asNumber >= 1 && asNumber <= 5) {
    return (asNumber - 3) / 2;
  }

  const map: Record<string, number> = {
    A: -1,
    B: -0.5,
    C: 0,
    D: 0.5,
    E: 1,
  };
  return clamp(map[option] ?? 0, -1, 1);
}

export function toNormalizedAvatarAnswers(answers: AvatarAnswerInput[]): NormalizedAvatarAnswer[] {
  return normalizeAnswers(answers);
}

export function mapAnswersToTraitDeltas(answers: AvatarAnswerInput[]): Partial<TraitVector> {
  const normalized = toNormalizedAvatarAnswers(answers);
  const deltas: Partial<TraitVector> = {};

  normalized.forEach((answer) => {
    const signed = optionToSignedValue(answer.option);
    const intensity = Math.abs(signed);
    const primary = TRAIT_KEYS[hash32(`${answer.questionId}:p`) % TRAIT_KEYS.length];
    const secondary = TRAIT_KEYS[hash32(`${answer.questionId}:s`) % TRAIT_KEYS.length];
    const directionPrimary = (hash32(`${answer.questionId}:d1`) & 1) === 0 ? 1 : -1;
    const directionSecondary = (hash32(`${answer.questionId}:d2`) & 1) === 0 ? 1 : -1;

    deltas[primary] = (deltas[primary] ?? 0) + signed * directionPrimary * 0.09;
    deltas[secondary] = (deltas[secondary] ?? 0) + signed * intensity * directionSecondary * 0.04;
  });

  return deltas;
}

