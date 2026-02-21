import type { DimensionScores } from "@/lib/types";

export type TraitPairBreakdown = {
  dimension: "EI" | "SN" | "TF" | "JP";
  leftLabel: string;
  rightLabel: string;
  leftPercent: number;
  rightPercent: number;
  note: string;
};

export type MbtiDashboardProfile = {
  mbti: string;
  roleName: string;
  oneLiner: string;
  tags: string[];
  strengths: string[];
  challenges: string[];
  coreAdvantages: string[];
  longText: string[];
  pairBreakdown: TraitPairBreakdown[];
  growthPath: {
    careers: string[];
    learningStyle: string;
    relationshipAdvice: string;
    growthAdvice: string;
  };
  radarE_N_F_J: [number, number, number, number];
};

export type MbtiCompareRow = {
  axis: string;
  current: string;
  target: string;
  insight: string;
};

export type MbtiCompareProfile = {
  currentMbti: string;
  targetMbti: string;
  currentRadar: [number, number, number, number];
  targetRadar: [number, number, number, number];
  rows: MbtiCompareRow[];
};

const ROLE_NAME: Record<string, string> = {
  INTJ: "建筑师",
  INTP: "逻辑学家",
  ENTJ: "指挥官",
  ENTP: "辩论家",
  INFJ: "提倡者",
  INFP: "调停者",
  ENFJ: "主人公",
  ENFP: "竞选者",
  ISTJ: "物流师",
  ISFJ: "守卫者",
  ESTJ: "总经理",
  ESFJ: "执政官",
  ISTP: "鉴赏家",
  ISFP: "探险家",
  ESTP: "企业家",
  ESFP: "表演者",
};

const MBTI_LIST = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toPct(score: number) {
  return clamp(Math.round(((score + 1) / 2) * 100), 1, 99);
}

function fallbackScores(): DimensionScores {
  return { EI: 0, SN: 0, TF: 0, JP: 0 };
}

function scoreByMbti(mbtiType: string): DimensionScores {
  const mbti = mbtiType.toUpperCase();
  const base = fallbackScores();
  base.EI = mbti.includes("E") ? 0.56 : -0.56;
  base.SN = mbti.includes("S") ? 0.56 : -0.56;
  base.TF = mbti.includes("T") ? 0.56 : -0.56;
  base.JP = mbti.includes("J") ? 0.56 : -0.56;
  return base;
}

export function getMbtiList() {
  return [...MBTI_LIST];
}

export function getPairBreakdown(scoresInput?: Partial<DimensionScores> | null): TraitPairBreakdown[] {
  const scores: DimensionScores = {
    ...fallbackScores(),
    ...scoresInput,
  };
  const e = toPct(scores.EI);
  const s = toPct(scores.SN);
  const t = toPct(scores.TF);
  const j = toPct(scores.JP);

  return [
    {
      dimension: "EI",
      leftLabel: "外向",
      rightLabel: "内向",
      leftPercent: e,
      rightPercent: 100 - e,
      note: e >= 50 ? "你更容易通过互动补充能量。" : "你更倾向通过独处恢复专注。",
    },
    {
      dimension: "SN",
      leftLabel: "务实",
      rightLabel: "直觉",
      leftPercent: s,
      rightPercent: 100 - s,
      note: s >= 50 ? "你更看重事实与可落地路径。" : "你更擅长从可能性中寻找机会。",
    },
    {
      dimension: "TF",
      leftLabel: "理性",
      rightLabel: "情感",
      leftPercent: t,
      rightPercent: 100 - t,
      note: t >= 50 ? "你决策时优先考虑逻辑一致性。" : "你决策时会更多考虑关系与感受。",
    },
    {
      dimension: "JP",
      leftLabel: "计划",
      rightLabel: "灵活",
      leftPercent: j,
      rightPercent: 100 - j,
      note: j >= 50 ? "你偏好有结构的执行节奏。" : "你更习惯边探索边调整。",
    },
  ];
}

function summaryByMbti(mbti: string) {
  const name = ROLE_NAME[mbti] ?? "综合型";
  const lead = mbti.includes("E") ? "对外连接" : "深度内省";
  const style = mbti.includes("N") ? "抽象洞察" : "现实落地";
  const decision = mbti.includes("F") ? "关系共情" : "理性判断";
  const pace = mbti.includes("J") ? "结构推进" : "灵活探索";
  return {
    roleName: name,
    oneLiner: `${name}型人格，擅长以${lead}驱动${style}，并通过${decision}与${pace}形成稳定行动闭环。`,
  };
}

function strengthsByMbti(mbti: string) {
  return [
    mbti.includes("E") ? "推动协作与调动氛围能力强" : "独立深度思考与长期专注能力强",
    mbti.includes("N") ? "善于抽象建模与未来预判" : "善于细节执行与资源整合",
    mbti.includes("F") ? "对人际线索敏感，擅长共识构建" : "判断标准清晰，决策效率高",
  ];
}

function challengesByMbti(mbti: string) {
  return [
    mbti.includes("P")
      ? "在多任务环境下可能出现优先级漂移"
      : "在变化场景中可能过早锁定方案",
    mbti.includes("T")
      ? "在高压沟通中可能忽略情绪成本"
      : "在冲突决策中可能延迟做出取舍",
  ];
}

function growthPathByMbti(mbti: string) {
  const group = `${mbti[1] ?? "S"}${mbti[2] ?? "T"}`;

  if (group === "NT") {
    return {
      careers: ["产品战略与架构设计", "数据分析与增长策略", "技术管理与咨询"],
      learningStyle: "通过模型化学习最有效：先搭框架，再做案例拆解。",
      relationshipAdvice: "表达观点前先确认对方目标，可显著减少沟通摩擦。",
      growthAdvice: "每周固定一次“用户视角复盘”，补齐纯逻辑视角盲区。",
    };
  }
  if (group === "NF") {
    return {
      careers: ["品牌与内容策划", "教育咨询与赋能", "用户研究与体验设计"],
      learningStyle: "先建立意义感，再进入系统化训练，学习效率更高。",
      relationshipAdvice: "在共情之外增加边界表达，能让关系更稳定。",
      growthAdvice: "把灵感写成可执行清单，避免长期停留在想法层。",
    };
  }
  if (group === "SJ") {
    return {
      careers: ["项目管理与流程运营", "财务风控与合规管理", "组织治理与行政管理"],
      learningStyle: "分步骤、可检查点的学习路径更容易持续。",
      relationshipAdvice: "先肯定再给建议，有助于提升协作接受度。",
      growthAdvice: "刻意练习“试错窗口”，提升对不确定性的承受力。",
    };
  }
  return {
    careers: ["市场拓展与商务协作", "活动运营与现场管理", "创意制作与传播执行"],
    learningStyle: "通过实操和即时反馈学习，转化速度最快。",
    relationshipAdvice: "关键沟通前准备一句目标声明，减少信息跑偏。",
    growthAdvice: "在行动优势基础上补充复盘机制，形成可复制成长。",
  };
}

function buildLongText(profile: MbtiDashboardProfile) {
  return [
    `作为${profile.mbti}（${profile.roleName}）类型，你在现实中的优势通常体现在“判断路径清晰 + 行动转换迅速”。你更容易在复杂情境中抓住关键变量，并形成可执行方案。`,
    `从近期测验维度看，你的人格表达并非固定标签，而是存在可观察的波动带。保持优势的关键是：在高压环境中坚持你的决策标准，同时保留对外部反馈的修正空间。`,
    `成长上建议优先关注两个方向：第一，放大核心优势并形成方法论；第二，针对潜在挑战设置补偿机制。这样你的人格表现会更稳定，也更有持续进化的空间。`,
  ];
}

export function buildMbtiDashboardProfile(input: {
  mbtiType: string;
  scores?: Partial<DimensionScores> | null;
  archetype?: string;
  traits?: string[];
}) {
  const mbti = (input.mbtiType || "UNKN").toUpperCase();
  const role = summaryByMbti(mbti);
  const pairBreakdown = getPairBreakdown(input.scores);
  const growthPath = growthPathByMbti(mbti);
  const strengths = strengthsByMbti(mbti);
  const challenges = challengesByMbti(mbti);
  const tags = [
    `${mbti}型`,
    role.roleName,
    mbti.includes("E") ? "高连接" : "高专注",
    mbti.includes("N") ? "洞察驱动" : "执行驱动",
    ...(input.archetype ? [input.archetype] : []),
    ...(input.traits?.slice(0, 3) ?? []),
  ].filter(Boolean);

  const e = toPct((input.scores?.EI ?? scoreByMbti(mbti).EI) as number);
  const s = toPct((input.scores?.SN ?? scoreByMbti(mbti).SN) as number);
  const t = toPct((input.scores?.TF ?? scoreByMbti(mbti).TF) as number);
  const j = toPct((input.scores?.JP ?? scoreByMbti(mbti).JP) as number);

  const profile: MbtiDashboardProfile = {
    mbti,
    roleName: role.roleName,
    oneLiner: role.oneLiner,
    tags: Array.from(new Set(tags)).slice(0, 8),
    strengths,
    challenges,
    coreAdvantages: strengths.slice(0, 3),
    longText: [],
    pairBreakdown,
    growthPath,
    radarE_N_F_J: [e, 100 - s, 100 - t, j],
  };
  profile.longText = buildLongText(profile);
  return profile;
}

function labelByLetter(letter: string) {
  const map: Record<string, string> = {
    E: "外向连接",
    I: "内向专注",
    S: "务实落地",
    N: "直觉洞察",
    T: "理性判断",
    F: "情感共情",
    J: "计划推进",
    P: "灵活探索",
  };
  return map[letter] ?? letter;
}

export function buildMbtiCompare(input: {
  currentMbti: string;
  targetMbti: string;
  currentScores?: Partial<DimensionScores> | null;
}): MbtiCompareProfile {
  const current = input.currentMbti.toUpperCase();
  const target = input.targetMbti.toUpperCase();
  const currentScore = { ...scoreByMbti(current), ...input.currentScores };
  const targetScore = scoreByMbti(target);

  const currentRadar: [number, number, number, number] = [
    toPct(currentScore.EI),
    100 - toPct(currentScore.SN),
    100 - toPct(currentScore.TF),
    toPct(currentScore.JP),
  ];
  const targetRadar: [number, number, number, number] = [
    toPct(targetScore.EI),
    100 - toPct(targetScore.SN),
    100 - toPct(targetScore.TF),
    toPct(targetScore.JP),
  ];

  const rows: MbtiCompareRow[] = [
    {
      axis: "能量来源",
      current: labelByLetter(current[0] ?? "E"),
      target: labelByLetter(target[0] ?? "E"),
      insight: current[0] === target[0] ? "你们在社交节奏上接近，协作阻力较小。" : "你们在社交偏好上不同，建议先对齐沟通频次。",
    },
    {
      axis: "信息处理",
      current: labelByLetter(current[1] ?? "S"),
      target: labelByLetter(target[1] ?? "S"),
      insight: current[1] === target[1] ? "你们对事实/可能性的关注点一致。" : "一个看细节一个看趋势，适合搭配分工。",
    },
    {
      axis: "决策方式",
      current: labelByLetter(current[2] ?? "T"),
      target: labelByLetter(target[2] ?? "T"),
      insight: current[2] === target[2] ? "冲突下判断逻辑接近，决策效率较高。" : "建议先分离“事实”和“感受”再讨论结论。",
    },
    {
      axis: "执行风格",
      current: labelByLetter(current[3] ?? "J"),
      target: labelByLetter(target[3] ?? "J"),
      insight: current[3] === target[3] ? "任务推进节奏一致，便于共同行动。" : "一方偏计划一方偏弹性，建议设置里程碑与调整窗口。",
    },
  ];

  return {
    currentMbti: current,
    targetMbti: target,
    currentRadar,
    targetRadar,
    rows,
  };
}
