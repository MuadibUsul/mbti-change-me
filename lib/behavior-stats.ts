import { clamp, mean, round, stdDev } from "@/lib/math";
import { likertToNumeric, resolveContribution, type ScoringAnswer, type ScoringQuestion } from "@/lib/scoring";
import type { BehaviorStats, Dimension } from "@/lib/types";

type DimensionBuckets = Record<Dimension, number[]>;

const DIMENSIONS: Dimension[] = ["EI", "SN", "TF", "JP"];

function initBuckets(): DimensionBuckets {
  return { EI: [], SN: [], TF: [], JP: [] };
}

export function calculateBehaviorStats(
  questions: ScoringQuestion[],
  answers: ScoringAnswer[],
  completionSeconds?: number,
): BehaviorStats {
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const mappedAbs: number[] = [];
  const neutralFlags: number[] = [];
  const byDimension = initBuckets();
  const forwardByDimension = initBuckets();
  const reverseByDimension = initBuckets();

  answers.forEach((answer) => {
    const question = questionMap.get(answer.questionId);
    if (!question) return;

    const rawLikert = likertToNumeric(answer.choice);
    const oriented = resolveContribution(question, answer.choice);

    mappedAbs.push(Math.abs(rawLikert));
    neutralFlags.push(answer.choice === 3 ? 1 : 0);
    byDimension[question.dimension].push(oriented);

    if (question.reverseScoring) {
      reverseByDimension[question.dimension].push(oriented);
    } else {
      forwardByDimension[question.dimension].push(oriented);
    }
  });

  const extremity = round(clamp(mean(mappedAbs) / 2, 0, 1), 4);
  const neutrality = round(clamp(mean(neutralFlags), 0, 1), 4);

  const stds = DIMENSIONS.map((dimension) => stdDev(byDimension[dimension]));
  const avgStd = mean(stds);
  const consistency = round(clamp(1 - avgStd / 2, 0, 1), 4);

  const conflictSignals = DIMENSIONS.map((dimension) => {
    const fwd = forwardByDimension[dimension];
    const rev = reverseByDimension[dimension];
    if (!fwd.length || !rev.length) return 0;

    const fwdMean = mean(fwd);
    const revMean = mean(rev);
    const sameDirection = Math.sign(fwdMean) === Math.sign(revMean);
    const weak = Math.abs(fwdMean) < 0.25 || Math.abs(revMean) < 0.25;
    return sameDirection || weak ? 0 : 1;
  });
  const reverseSensitivity = round(clamp(mean(conflictSignals), 0, 1), 4);

  let completionPace: number | undefined;
  if (completionSeconds && answers.length > 0) {
    const secPerQuestion = completionSeconds / answers.length;
    completionPace = round(clamp((20 - secPerQuestion) / 15, 0, 1), 4);
  }

  return {
    extremity,
    consistency,
    neutrality,
    reverseSensitivity,
    completionPace,
  };
}
