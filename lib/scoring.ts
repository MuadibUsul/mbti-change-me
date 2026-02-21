import { LIKERT_TO_SCORE } from "@/lib/constants";
import { clamp, round } from "@/lib/math";
import type { Dimension, DimensionLetters, DimensionScores } from "@/lib/types";

export type ScoringQuestion = {
  id: string;
  dimension: Dimension;
  direction: number;
  reverseScoring: boolean;
};

export type ScoringAnswer = {
  questionId: string;
  choice: number;
};

const DIMENSION_PAIR: Record<Dimension, [string, string]> = {
  EI: ["E", "I"],
  SN: ["S", "N"],
  TF: ["T", "F"],
  JP: ["J", "P"],
};

export function likertToNumeric(choice: number) {
  return LIKERT_TO_SCORE[choice] ?? 0;
}

export function resolveContribution(
  question: ScoringQuestion,
  choice: number,
  options?: { ignoreReverse?: boolean },
) {
  const base = likertToNumeric(choice);
  const reverse = options?.ignoreReverse ? 1 : question.reverseScoring ? -1 : 1;
  return base * question.direction * reverse;
}

export function scoreSession(
  questions: ScoringQuestion[],
  answers: ScoringAnswer[],
): {
  rawScores: DimensionScores;
  normalizedScores: DimensionScores;
  letters: DimensionLetters;
  mbti: string;
  answerMappedValues: Record<string, number>;
} {
  const byQuestion = new Map(questions.map((q) => [q.id, q]));
  const rawScores: DimensionScores = { EI: 0, SN: 0, TF: 0, JP: 0 };
  const maxByDimension: Record<Dimension, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };
  const answerMappedValues: Record<string, number> = {};

  questions.forEach((question) => {
    maxByDimension[question.dimension] += 2;
  });

  answers.forEach((answer) => {
    const question = byQuestion.get(answer.questionId);
    if (!question) return;
    const mapped = resolveContribution(question, answer.choice);
    rawScores[question.dimension] += mapped;
    answerMappedValues[answer.questionId] = mapped;
  });

  const normalizedScores: DimensionScores = { EI: 0, SN: 0, TF: 0, JP: 0 };
  const letters: DimensionLetters = { EI: "E", SN: "S", TF: "T", JP: "J" };

  (["EI", "SN", "TF", "JP"] as const).forEach((dimension) => {
    const maxAbs = maxByDimension[dimension] || 1;
    const normalized = clamp(rawScores[dimension] / maxAbs, -1, 1);
    normalizedScores[dimension] = round(normalized, 4);
    letters[dimension] = normalized >= 0 ? DIMENSION_PAIR[dimension][0] : DIMENSION_PAIR[dimension][1];
  });

  const mbti = `${letters.EI}${letters.SN}${letters.TF}${letters.JP}`;

  return {
    rawScores,
    normalizedScores,
    letters,
    mbti,
    answerMappedValues,
  };
}
