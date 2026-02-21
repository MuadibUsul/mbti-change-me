import type { QuestionChoice } from "@/lib/types";

export const LIKERT_CHOICES: QuestionChoice[] = [
  { label: "非常不同意", value: 1 },
  { label: "不同意", value: 2 },
  { label: "中立", value: 3 },
  { label: "同意", value: 4 },
  { label: "非常同意", value: 5 },
];

export const LIKERT_TO_SCORE: Record<number, -2 | -1 | 0 | 1 | 2> = {
  1: -2,
  2: -1,
  3: 0,
  4: 1,
  5: 2,
};

export const DIMENSION_LABELS = {
  EI: "外向(E) -> 内向(I)",
  SN: "感觉(S) -> 直觉(N)",
  TF: "思考(T) -> 情感(F)",
  JP: "判断(J) -> 感知(P)",
} as const;

export const REGION_KEYS = ["head", "chest", "belly", "armL", "armR", "legL", "legR", "aura"] as const;
