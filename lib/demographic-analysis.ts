import type { DimensionScores } from "@/lib/types";

export type DemographicGender = "male" | "female" | "nonbinary" | "private";

export type DemographicProfile = {
  age: number;
  gender: DemographicGender;
};

export type BasicPersonaAnalysis = {
  title: string;
  subtitle: string;
  personality: string;
  career: string;
  growth: string;
  relationship: string;
  highlights: string[];
};

const MBTI_LABELS: Record<string, string> = {
  INTJ: "战略型思考者",
  INTP: "逻辑探索者",
  ENTJ: "统筹领导者",
  ENTP: "创意挑战者",
  INFJ: "洞察引导者",
  INFP: "理想共情者",
  ENFJ: "组织激励者",
  ENFP: "灵感连接者",
  ISTJ: "秩序执行者",
  ISFJ: "稳定守护者",
  ESTJ: "行动管理者",
  ESFJ: "协作照顾者",
  ISTP: "冷静实干者",
  ISFP: "审美体验者",
  ESTP: "机会行动者",
  ESFP: "氛围驱动者",
};

function ageBand(age: number) {
  if (age < 18) return "青少年阶段";
  if (age < 25) return "青年起步阶段";
  if (age < 35) return "职业成长期";
  if (age < 45) return "成熟发展期";
  return "经验整合期";
}

function dominantDimension(scores: DimensionScores) {
  const dimensions = (Object.keys(scores) as Array<keyof DimensionScores>).map((key) => ({
    key,
    score: Math.abs(scores[key]),
    raw: scores[key],
  }));
  dimensions.sort((a, b) => b.score - a.score);
  return dimensions[0];
}

function weakestDimension(scores: DimensionScores) {
  const dimensions = (Object.keys(scores) as Array<keyof DimensionScores>).map((key) => ({
    key,
    score: Math.abs(scores[key]),
    raw: scores[key],
  }));
  dimensions.sort((a, b) => a.score - b.score);
  return dimensions[0];
}

export function buildBasicPersonaAnalysis(input: {
  mbtiType: string;
  scores: DimensionScores;
  profile: DemographicProfile;
}): BasicPersonaAnalysis {
  const mbti = input.mbtiType.toUpperCase();
  const label = MBTI_LABELS[mbti] ?? "综合人格类型";
  const dominant = dominantDimension(input.scores);
  const weakest = weakestDimension(input.scores);

  const dominantLabel = {
    EI: dominant.raw >= 0 ? "外向表达" : "内向深思",
    SN: dominant.raw >= 0 ? "现实感知" : "直觉联想",
    TF: dominant.raw >= 0 ? "理性判断" : "情感判断",
    JP: dominant.raw >= 0 ? "规划执行" : "灵活探索",
  }[dominant.key];

  const weakestLabel = {
    EI: "表达与独处平衡",
    SN: "细节与全局平衡",
    TF: "理性与感受平衡",
    JP: "计划与弹性平衡",
  }[weakest.key];

  const band = ageBand(input.profile.age);

  return {
    title: `${mbti} · ${label}`,
    subtitle: `年龄 ${input.profile.age} 岁（${band}）`,
    personality: `你的核心驱动力偏向“${dominantLabel}”。在当前阶段，你更容易在熟悉优势场景中做出高质量表现，遇到复杂情境时会通过${mbti.startsWith("I") ? "内在推演" : "外部互动"}来确认方向。`,
    career: `职业发展建议优先选择能放大 ${mbti} 优势的岗位：把你擅长的${dominantLabel}转化为稳定可复用的方法论。短期建议聚焦 1 个主战方向，建立可量化作品或成果。`,
    growth: `你目前最需要补强的是“${weakestLabel}”。建议每周安排一次复盘：记录一次判断过程，拆分“事实、感受、结论、行动”四步，减少单一路径惯性。`,
    relationship: `在人际协作中，你通常会以${mbti.includes("F") ? "情绪与关系线索" : "目标与逻辑线索"}来理解他人。建议在关键对话中增加“我理解你在意的是…”这一句，能显著降低误解。`,
    highlights: [
      `主导维度：${dominant.key}（${dominantLabel}）`,
      `当前阶段：${band}`,
      `成长重点：${weakestLabel}`,
    ],
  };
}
