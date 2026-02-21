import { clamp, mean, round, stdDev } from "@/lib/math";
import type { BehaviorStats, Dimension, DimensionScores } from "@/lib/types";

export type PersonaModel = {
  archetype: string;
  vulnerableDimension: Dimension;
  growthDimension: Dimension;
  stableDimension: Dimension;
  contradictionIndex: number;
  reflectionDepth: number;
  confidence: number;
  expressionStyle: "reserved" | "balanced" | "expressive";
  trustStyle: "guarded" | "selective" | "open";
  coreDrivers: string[];
  narrativeSeed: string;
};

type HistorySessionInput = {
  mbtiType?: string | null;
  dimensionScores: Array<{ dimension: string; normalizedScore: number }>;
  behaviorStats?: unknown;
};

const DIMENSIONS: Dimension[] = ["EI", "SN", "TF", "JP"];

function parseBehavior(raw: unknown): Required<BehaviorStats> {
  const fallback: Required<BehaviorStats> = {
    extremity: 0.5,
    consistency: 0.5,
    neutrality: 0.3,
    reverseSensitivity: 0.25,
    completionPace: 0.5,
  };
  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Partial<BehaviorStats>;
  return {
    extremity: clamp(data.extremity ?? fallback.extremity, 0, 1),
    consistency: clamp(data.consistency ?? fallback.consistency, 0, 1),
    neutrality: clamp(data.neutrality ?? fallback.neutrality, 0, 1),
    reverseSensitivity: clamp(data.reverseSensitivity ?? fallback.reverseSensitivity, 0, 1),
    completionPace: clamp(data.completionPace ?? fallback.completionPace, 0, 1),
  };
}

function toScoreMap(rows: Array<{ dimension: string; normalizedScore: number }>): DimensionScores {
  const map: DimensionScores = { EI: 0, SN: 0, TF: 0, JP: 0 };
  rows.forEach((row) => {
    const key = row.dimension as Dimension;
    if (key in map) map[key] = clamp(row.normalizedScore, -1, 1);
  });
  return map;
}

function archetypeByScores(avg: DimensionScores, behavior: Required<BehaviorStats>) {
  const e = avg.EI >= 0 ? "E" : "I";
  const s = avg.SN >= 0 ? "S" : "N";
  const t = avg.TF >= 0 ? "T" : "F";
  const j = avg.JP >= 0 ? "J" : "P";
  const mbti = `${e}${s}${t}${j}`;

  const map: Record<string, string> = {
    INTJ: "战略构建者",
    INTP: "洞察分析者",
    ENTJ: "目标推进者",
    ENTP: "创新辩证者",
    INFJ: "愿景整合者",
    INFP: "价值守护者",
    ENFJ: "关系引导者",
    ENFP: "灵感点燃者",
    ISTJ: "秩序执行者",
    ISFJ: "稳定照护者",
    ESTJ: "结构组织者",
    ESFJ: "群体协同者",
    ISTP: "冷静解构者",
    ISFP: "感受创作者",
    ESTP: "现场行动者",
    ESFP: "氛围激活者",
  };

  const base = map[mbti] ?? "综合平衡者";
  if (behavior.reverseSensitivity > 0.6) return `${base}（内在冲突期）`;
  if (behavior.consistency > 0.7) return `${base}（稳定发展期）`;
  return base;
}

function selectDimensionByMax(values: Record<Dimension, number>): Dimension {
  const list = Object.entries(values) as [Dimension, number][];
  list.sort((a, b) => b[1] - a[1]);
  return list[0][0];
}

function buildDrivers(avg: DimensionScores, behavior: Required<BehaviorStats>) {
  const drivers: string[] = [];
  if (avg.EI > 0.25) drivers.push("通过对外互动与反馈获取推进动力");
  if (avg.EI < -0.25) drivers.push("通过独处反思沉淀判断");
  if (avg.SN > 0.25) drivers.push("依赖事实与经验建立安全感");
  if (avg.SN < -0.25) drivers.push("依赖可能性与意义感定位方向");
  if (avg.TF > 0.25) drivers.push("通过原则与逻辑维持边界");
  if (avg.TF < -0.25) drivers.push("通过关系与感受校准决策");
  if (avg.JP > 0.25) drivers.push("通过计划与收束降低不确定焦虑");
  if (avg.JP < -0.25) drivers.push("通过弹性与留白保持创造空间");
  if (behavior.neutrality > 0.45) drivers.push("在模糊阶段倾向先观察再判断");
  return drivers.slice(0, 3);
}

export function buildPersonaModel(history: HistorySessionInput[]): PersonaModel {
  if (!history.length) {
    return {
      archetype: "初始探索者",
      vulnerableDimension: "TF",
      growthDimension: "EI",
      stableDimension: "SN",
      contradictionIndex: 0.25,
      reflectionDepth: 0.45,
      confidence: 0.35,
      expressionStyle: "balanced",
      trustStyle: "selective",
      coreDrivers: ["正在建立第一版自我人格地图"],
      narrativeSeed: "你当前仍在形成稳定偏好，后续题目会同时包含基础题和深挖题。",
    };
  }

  const scoreHistory = history.map((session) => toScoreMap(session.dimensionScores));
  const behaviorHistory = history.map((session) => parseBehavior(session.behaviorStats));
  const avgScores: DimensionScores = { EI: 0, SN: 0, TF: 0, JP: 0 };
  const volatility: Record<Dimension, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };
  const signFlipRate: Record<Dimension, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };

  DIMENSIONS.forEach((dimension) => {
    const values = scoreHistory.map((item) => item[dimension]);
    avgScores[dimension] = round(mean(values), 4);
    volatility[dimension] = round(stdDev(values), 4);
    if (values.length > 1) {
      let flips = 0;
      for (let i = 1; i < values.length; i += 1) {
        if (Math.sign(values[i]) !== Math.sign(values[i - 1])) flips += 1;
      }
      signFlipRate[dimension] = flips / (values.length - 1);
    }
  });

  const avgBehavior = {
    extremity: mean(behaviorHistory.map((b) => b.extremity)),
    consistency: mean(behaviorHistory.map((b) => b.consistency)),
    neutrality: mean(behaviorHistory.map((b) => b.neutrality)),
    reverseSensitivity: mean(behaviorHistory.map((b) => b.reverseSensitivity)),
    completionPace: mean(behaviorHistory.map((b) => b.completionPace)),
  };

  const stableScores: Record<Dimension, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };
  const vulnerableScores: Record<Dimension, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };

  DIMENSIONS.forEach((dimension) => {
    stableScores[dimension] =
      Math.abs(avgScores[dimension]) * 0.65 +
      (1 - volatility[dimension]) * 0.25 +
      (1 - signFlipRate[dimension]) * 0.1;

    vulnerableScores[dimension] =
      volatility[dimension] * 0.55 +
      signFlipRate[dimension] * 0.25 +
      (1 - Math.abs(avgScores[dimension])) * 0.2;
  });

  const stableDimension = selectDimensionByMax(stableScores);
  const vulnerableDimension = selectDimensionByMax(vulnerableScores);
  const growthDimension = selectDimensionByMax({
    EI: vulnerableDimension === "EI" ? vulnerableScores.EI * 0.8 : vulnerableScores.EI,
    SN: vulnerableDimension === "SN" ? vulnerableScores.SN * 0.8 : vulnerableScores.SN,
    TF: vulnerableDimension === "TF" ? vulnerableScores.TF * 0.8 : vulnerableScores.TF,
    JP: vulnerableDimension === "JP" ? vulnerableScores.JP * 0.8 : vulnerableScores.JP,
  });

  const contradictionIndex = round(
    clamp(
      avgBehavior.reverseSensitivity * 0.55 +
        mean(Object.values(signFlipRate)) * 0.3 +
        (1 - avgBehavior.consistency) * 0.25,
      0,
      1,
    ),
    4,
  );

  const reflectionDepth = round(
    clamp(
      avgBehavior.neutrality * 0.25 +
        contradictionIndex * 0.35 +
        (1 - mean(Object.values(stableScores))) * 0.2 +
        avgBehavior.extremity * 0.2,
      0,
      1,
    ),
    4,
  );

  const confidence = round(
    clamp(
      mean(Object.values(stableScores)) * 0.5 +
        avgBehavior.consistency * 0.35 +
        (1 - contradictionIndex) * 0.25,
      0,
      1,
    ),
    4,
  );

  const expressionStyle: PersonaModel["expressionStyle"] =
    avgScores.EI > 0.28 ? "expressive" : avgScores.EI < -0.28 ? "reserved" : "balanced";
  const trustStyle: PersonaModel["trustStyle"] =
    avgScores.TF < -0.2 && avgBehavior.neutrality > 0.35
      ? "open"
      : avgScores.TF > 0.2 && contradictionIndex > 0.45
        ? "guarded"
        : "selective";

  const archetype = archetypeByScores(avgScores, parseBehavior(avgBehavior));
  const coreDrivers = buildDrivers(avgScores, parseBehavior(avgBehavior));

  const narrativeSeed =
    contradictionIndex > 0.58
      ? "你在多场景中存在价值拉扯，后续题目将继续聚焦情境冲突与行为选择。"
      : confidence > 0.68
        ? "你的人格结构正趋于稳定，后续会更多探索深层情绪驱动与关系模式。"
        : "你处在整合阶段，后续题目将帮助你识别触发点与稳定偏好。";

  return {
    archetype,
    vulnerableDimension,
    growthDimension,
    stableDimension,
    contradictionIndex,
    reflectionDepth,
    confidence,
    expressionStyle,
    trustStyle,
    coreDrivers,
    narrativeSeed,
  };
}
