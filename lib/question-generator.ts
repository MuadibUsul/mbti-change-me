import seedrandom from "seedrandom";
import { LIKERT_CHOICES } from "@/lib/constants";
import { shortHash } from "@/lib/hash";
import { clamp } from "@/lib/math";
import { MBTI_QUESTION_BANK, type MBTIQuestionItem } from "@/lib/mbti-question-bank";
import type { PersonaModel } from "@/lib/persona-model";
import type { Dimension, DimensionScores, GeneratedQuestion } from "@/lib/types";

type QuestionGenerationContext = {
  personaModel?: PersonaModel | null;
  historyCount?: number;
  recentQuestionTexts?: string[];
  latestScores?: Partial<DimensionScores> | null;
  latestBehavior?: {
    extremity?: number;
    consistency?: number;
    neutrality?: number;
    reverseSensitivity?: number;
  } | null;
};

function weightedDimensionMap(context?: QuestionGenerationContext) {
  const base: Record<Dimension, number> = { EI: 1, SN: 1, TF: 1, JP: 1 };
  const personaModel = context?.personaModel;
  const reverseSensitivity = context?.latestBehavior?.reverseSensitivity ?? 0;

  if (personaModel) {
    base[personaModel.vulnerableDimension] += 0.9;
    base[personaModel.growthDimension] += 0.55;
    base[personaModel.stableDimension] += 0.2;
    if (personaModel.contradictionIndex > 0.55) base[personaModel.vulnerableDimension] += 0.4;
  }

  const latestScores = context?.latestScores;
  if (latestScores) {
    (["EI", "SN", "TF", "JP"] as const).forEach((dimension) => {
      const score = latestScores[dimension];
      if (typeof score !== "number") return;
      const certainty = Math.abs(score);
      if (certainty < 0.22) base[dimension] += 0.75;
      if (certainty >= 0.75) base[dimension] += 0.12;
    });
  }

  if (reverseSensitivity > 0.55) {
    base.TF += 0.2;
    base.JP += 0.2;
  }

  return base;
}

function allocateCounts(count: number, context?: QuestionGenerationContext) {
  const weights = weightedDimensionMap(context);
  const dims: Dimension[] = ["EI", "SN", "TF", "JP"];
  const sum = dims.reduce((acc, dimension) => acc + weights[dimension], 0);
  const result = new Map<Dimension, number>();
  let allocated = 0;

  dims.forEach((dimension) => {
    const base = Math.max(5, Math.floor((count * weights[dimension]) / sum));
    result.set(dimension, base);
    allocated += base;
  });

  let remain = count - allocated;
  const ranking = [...dims].sort((a, b) => weights[b] - weights[a]);
  let i = 0;

  while (remain > 0) {
    const d = ranking[i % ranking.length];
    result.set(d, (result.get(d) ?? 0) + 1);
    remain -= 1;
    i += 1;
  }

  while (remain < 0) {
    const d = ranking[ranking.length - 1 - (i % ranking.length)];
    const current = result.get(d) ?? 0;
    if (current > 5) {
      result.set(d, current - 1);
      remain += 1;
    }
    i += 1;
  }

  return result;
}

function pickMany(pool: MBTIQuestionItem[], count: number, rng: () => number, excludes: Set<string>) {
  const available = pool.filter((item) => !excludes.has(item.text));
  const source = available.length >= count ? available : pool;
  if (!source.length || count <= 0) return [];

  const shuffled = source
    .map((item) => ({ item, random: rng() }))
    .sort((a, b) => a.random - b.random)
    .map((row) => row.item);

  const sampled: MBTIQuestionItem[] = [];
  if (shuffled.length >= count) {
    sampled.push(...shuffled.slice(0, count));
  } else {
    sampled.push(...shuffled);
    while (sampled.length < count) {
      sampled.push(shuffled[Math.floor(rng() * shuffled.length)]);
    }
  }

  sampled.forEach((item) => excludes.add(item.text));
  return sampled;
}

function selectByDimension(
  dimension: Dimension,
  target: number,
  rng: () => number,
  context?: QuestionGenerationContext,
  excludes?: Set<string>,
) {
  const all = MBTI_QUESTION_BANK.filter((item) => item.dimension === dimension);
  const baseline = all.filter((item) => item.intent === "baseline");
  const depth = all.filter((item) => item.intent === "depth");

  const depthRatio = context?.personaModel
    ? clamp(0.42 + context.personaModel.reflectionDepth * 0.36, 0.4, 0.84)
    : 0.46;

  const depthCount = Math.round(target * depthRatio);
  const baselineCount = target - depthCount;
  const ex = excludes ?? new Set<string>();

  return [
    ...pickMany(baseline, baselineCount, rng, ex),
    ...pickMany(depth, depthCount, rng, ex),
  ].sort(() => rng() - 0.5);
}

function warmLead(text: string) {
  return text;
}

export function generateQuestions(
  count = 36,
  seed?: string,
  context?: QuestionGenerationContext,
): GeneratedQuestion[] {
  const finalCount = Math.max(20, Math.min(60, count));
  const baseSeed = seed ?? `${Date.now()}`;
  const rng = seedrandom(baseSeed);

  const bankCount = finalCount;

  const counts = allocateCounts(bankCount, context);
  const excludes = new Set(context?.recentQuestionTexts ?? []);

  const selected: MBTIQuestionItem[] = [];
  (["EI", "SN", "TF", "JP"] as const).forEach((dimension) => {
    const target = counts.get(dimension) ?? 0;
    selected.push(...selectByDimension(dimension, target, rng, context, excludes));
  });

  const shuffled = [...selected]
    .map((item, idx) => ({ item, idx, random: rng() }))
    .sort((a, b) => a.random - b.random)
    .map((row, orderIndex) => ({ ...row.item, orderIndex }));

  return shuffled.map((item) => ({
    id: `q${item.orderIndex + 1}_${item.code}_${shortHash(`${baseSeed}-${item.code}`, 8)}`,
    text: warmLead(item.text),
    dimension: item.dimension,
    direction: item.direction,
    reverseScoring: item.reverseScoring,
    choices: LIKERT_CHOICES,
  }));
}
