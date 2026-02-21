"use client";

import type { Dimension } from "@/lib/types";

const DIMENSION_PAIR: Record<Dimension, [string, string]> = {
  EI: ["E", "I"],
  SN: ["S", "N"],
  TF: ["T", "F"],
  JP: ["J", "P"],
};

const DIMENSION_NAME: Record<Dimension, string> = {
  EI: "E/I",
  SN: "S/N",
  TF: "T/F",
  JP: "J/P",
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function buildWeakHintText(dimension: Dimension, pValue: number): string {
  const p = clamp01(pValue);
  const [first, second] = DIMENSION_PAIR[dimension];
  const pairName = DIMENSION_NAME[dimension];
  const confidence = Math.abs(p - 0.5) * 2;

  if (confidence < 0.2) {
    return `You are currently balanced on ${pairName}`;
  }

  const direction = p >= 0.5 ? first : second;
  const label = confidence > 0.6 ? "clearly leaning" : "slightly leaning";
  return `You are ${label} ${direction} on ${pairName}`;
}

export function WeakHint({ dimension, pValue }: { dimension: Dimension; pValue: number }) {
  return <>{buildWeakHintText(dimension, pValue)}</>;
}

