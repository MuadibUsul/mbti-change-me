import { mean, round, stdDev } from "@/lib/math";
import type { Dimension, DimensionScores, TrendInsight } from "@/lib/types";

export type TrendPoint = {
  createdAt: string;
  scores: DimensionScores;
  mbti?: string;
};

type RiskType = "extreme" | "indecision" | "volatility";

type AxisDiagnosis = {
  dimension: Dimension;
  score: number;
  volatility: number;
  trend: number;
  dominantSide: string;
  oppositeSide: string;
  riskType: RiskType;
  riskScore: number;
  weaknessTitle: string;
  weaknessDetail: string;
  actionFocus: string;
  reflectionPrompt: string;
  metric: string;
  dayActionA: string;
  dayActionB: string;
  cue: string;
};

const DIMENSIONS: Dimension[] = ["EI", "SN", "TF", "JP"];

function slope(values: number[]) {
  if (values.length < 2) return 0;
  const xs = values.map((_, index) => index);
  const xMean = mean(xs);
  const yMean = mean(values);
  const numerator = xs.reduce((sum, x, idx) => sum + (x - xMean) * (values[idx] - yMean), 0);
  const denominator = xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0) || 1;
  return numerator / denominator;
}

function level(value: number, low: number, high: number): "low" | "medium" | "high" {
  if (value >= high) return "high";
  if (value <= low) return "low";
  return "medium";
}

function axisSides(dimension: Dimension) {
  switch (dimension) {
    case "EI":
      return { positive: "外向行动", negative: "内向复盘" };
    case "SN":
      return { positive: "实感落地", negative: "直觉探索" };
    case "TF":
      return { positive: "理性判断", negative: "情感共情" };
    case "JP":
      return { positive: "结构收敛", negative: "弹性探索" };
    default:
      return { positive: "正向", negative: "反向" };
  }
}

function chooseRiskType(score: number, volatility: number): { riskType: RiskType; riskScore: number } {
  const absScore = Math.abs(score);
  const extremeRisk = Math.max(0, absScore - 0.62) * 1.8;
  const indecisionRisk = Math.max(0, 0.18 - absScore) * 2.2;
  const volatilityRisk = Math.max(0, volatility - 0.26) * 2.0;

  if (volatilityRisk >= extremeRisk && volatilityRisk >= indecisionRisk) {
    return { riskType: "volatility", riskScore: volatilityRisk };
  }
  if (indecisionRisk >= extremeRisk) {
    return { riskType: "indecision", riskScore: indecisionRisk };
  }
  return { riskType: "extreme", riskScore: extremeRisk };
}

function buildAxisDiagnosis(dimension: Dimension, score: number, volatility: number, trend: number): AxisDiagnosis {
  const { positive, negative } = axisSides(dimension);
  const dominantSide = score >= 0 ? positive : negative;
  const oppositeSide = score >= 0 ? negative : positive;
  const { riskType, riskScore } = chooseRiskType(score, volatility);

  if (dimension === "EI") {
    if (riskType === "extreme" && score >= 0) {
      return {
        dimension,
        score,
        volatility,
        trend,
        dominantSide,
        oppositeSide,
        riskType,
        riskScore,
        weaknessTitle: "外向输出过载",
        weaknessDetail: "互动与表达强度偏高，容易在未充分整理信息时就推进决策。",
        actionFocus: "重要沟通前先写 3 行“目标-风险-边界”，再发言或拍板。",
        reflectionPrompt: "最近一次你在高社交状态下快速做决定，忽略了哪个真实需求？",
        metric: "记录每天2次关键沟通后的能量值（0-10）与恢复时长",
        dayActionA: "今天在一场关键沟通前，先写3行提纲，再进入讨论。",
        dayActionB: "将一次决策复盘为“事实-判断-行动”，检查是否有跳步。",
        cue: "先写后说",
      };
    }

    if (riskType === "extreme" && score < 0) {
      return {
        dimension,
        score,
        volatility,
        trend,
        dominantSide,
        oppositeSide,
        riskType,
        riskScore,
        weaknessTitle: "内向闭环过深",
        weaknessDetail: "倾向独立消化问题，导致求助与信息同步时机偏晚。",
        actionFocus: "每天主动发起1次10分钟同步，并明确提出1个具体请求。",
        reflectionPrompt: "最近一次你本可求助却选择独自扛下，代价是什么？",
        metric: "统计“主动求助次数”与“问题关闭耗时”",
        dayActionA: "挑一个卡点问题，写出3个可被协助的具体子问题并发起沟通。",
        dayActionB: "复盘一次“自己扛”的场景，记录若提前同步可省下什么成本。",
        cue: "先同步再闭环",
      };
    }

    if (riskType === "indecision") {
      return {
        dimension,
        score,
        volatility,
        trend,
        dominantSide,
        oppositeSide,
        riskType,
        riskScore,
        weaknessTitle: "社交边界摇摆",
        weaknessDetail: "外向与内向节奏切换频繁，专注和恢复边界不清晰。",
        actionFocus: "固定“深度工作时段+回应时段”，降低无意识切换。",
        reflectionPrompt: "最近一次你说“都可以”时，真正担心失去的是什么？",
        metric: "记录被打断次数与单段专注时长",
        dayActionA: "连续90分钟深度工作，期间关闭即时通讯提醒。",
        dayActionB: "设置固定社交窗口，仅在窗口内处理低优先级消息。",
        cue: "边界先行",
      };
    }

    return {
      dimension,
      score,
      volatility,
      trend,
      dominantSide,
      oppositeSide,
      riskType,
      riskScore,
      weaknessTitle: "能量节奏波动",
      weaknessDetail: "同类情境下状态起伏偏大，容易在低能量时硬推任务。",
      actionFocus: "建立能量阈值：当能量<4分时先恢复，再做高风险决策。",
      reflectionPrompt: "你最近一次“明知状态不佳却继续硬撑”的后果是什么？",
      metric: "记录“低能量硬撑次数”与当日决策质量评分",
      dayActionA: "设置一次“能量<4立即暂停15分钟”的触发规则并执行。",
      dayActionB: "晚间复盘今天3次状态变化，标注触发原因。",
      cue: "先稳能量",
    };
  }

  if (dimension === "SN") {
    if (riskType === "extreme" && score >= 0) {
      return {
        dimension,
        score,
        volatility,
        trend,
        dominantSide,
        oppositeSide,
        riskType,
        riskScore,
        weaknessTitle: "细节驱动过强",
        weaknessDetail: "执行细节扎实，但容易低估长期想象与新可能性。",
        actionFocus: "每个任务开工前补写1条“未来3个月可能性”假设。",
        reflectionPrompt: "最近一次你因为追求稳妥而放弃尝试的新路径是什么？",
        metric: "记录“新增备选方案数量”与“被采纳比例”",
        dayActionA: "为当前项目新增2个非直觉方案，并写清风险与收益。",
        dayActionB: "复盘一次“按旧经验做”的决策，评估是否错过创新收益。",
        cue: "先想远一点",
      };
    }

    if (riskType === "extreme" && score < 0) {
      return {
        dimension,
        score,
        volatility,
        trend,
        dominantSide,
        oppositeSide,
        riskType,
        riskScore,
        weaknessTitle: "想象先行过快",
        weaknessDetail: "洞察和联想丰富，但容易在落地细节上欠账。",
        actionFocus: "把每个想法拆成“今天可执行的20分钟第一步”。",
        reflectionPrompt: "最近一次你有好想法却迟迟未落地，阻碍点是什么？",
        metric: "记录“想法转任务率”与“48小时内启动率”",
        dayActionA: "选择1个想法，写出“负责人-截止时间-验收标准”。",
        dayActionB: "把今天的抽象想法转成1页可执行清单并开始第一步。",
        cue: "先落地一步",
      };
    }

    if (riskType === "indecision") {
      return {
        dimension,
        score,
        volatility,
        trend,
        dominantSide,
        oppositeSide,
        riskType,
        riskScore,
        weaknessTitle: "感知策略不稳定",
        weaknessDetail: "在事实与直觉之间反复切换，决策标准不连续。",
        actionFocus: "决策时固定使用“双证据法”：1条事实 + 1条趋势推断。",
        reflectionPrompt: "最近一次你卡在“信息还不够”时，真正缺的是事实还是判断框架？",
        metric: "记录每次决策中的“事实证据数/趋势假设数”",
        dayActionA: "用双证据法完成一次决策记录卡。",
        dayActionB: "复盘最近一次判断失误，标注是事实不足还是推断过度。",
        cue: "双证据法",
      };
    }

    return {
      dimension,
      score,
      volatility,
      trend,
      dominantSide,
      oppositeSide,
      riskType,
      riskScore,
      weaknessTitle: "信息处理波动",
      weaknessDetail: "同类任务中时而过度细节、时而过度抽象，导致节奏断裂。",
      actionFocus: "先定信息层级：事实层(当下) -> 假设层(未来) -> 行动层(本周)。",
      reflectionPrompt: "你最近一次“看起来很忙却推进不稳”的核心断点在哪一层？",
      metric: "记录任务中“返工次数”与“因信息层级不清导致的延迟”",
      dayActionA: "把一个复杂任务拆成事实/假设/行动三层后再执行。",
      dayActionB: "晚上复盘1次返工，写下应在何时补充哪一层信息。",
      cue: "三层信息",
    };
  }

  if (dimension === "TF") {
    if (riskType === "extreme" && score >= 0) {
      return {
        dimension,
        score,
        volatility,
        trend,
        dominantSide,
        oppositeSide,
        riskType,
        riskScore,
        weaknessTitle: "结论优先过快",
        weaknessDetail: "逻辑和效率强，但在关系温度与接收感上可能偏弱。",
        actionFocus: "给建议前先做一次“感受复述”，再给结论。",
        reflectionPrompt: "最近一次你“说得对但对方没接受”，漏掉了哪一步共情？",
        metric: "记录沟通中“先共情后建议”的执行率",
        dayActionA: "今天至少1次先复述对方感受，再给执行建议。",
        dayActionB: "复盘一次冲突沟通，改写成“感受-事实-请求”版本。",
        cue: "先共情后结论",
      };
    }

    if (riskType === "extreme" && score < 0) {
      return {
        dimension,
        score,
        volatility,
        trend,
        dominantSide,
        oppositeSide,
        riskType,
        riskScore,
        weaknessTitle: "关系优先过度",
        weaknessDetail: "重视感受与和谐，但可能推迟必要判断与边界设定。",
        actionFocus: "决策前固定写下3条客观标准，再按标准给出结论。",
        reflectionPrompt: "最近一次你为避免冲突而延后决定，带来了什么隐性成本？",
        metric: "记录“按标准决策次数”与“延迟决策成本”",
        dayActionA: "使用3标准法完成一次你本来想回避的决定。",
        dayActionB: "把一次“拖着不说”的问题写成明确边界并沟通。",
        cue: "标准先行",
      };
    }

    if (riskType === "indecision") {
      return {
        dimension,
        score,
        volatility,
        trend,
        dominantSide,
        oppositeSide,
        riskType,
        riskScore,
        weaknessTitle: "判断标准摇摆",
        weaknessDetail: "在“讲逻辑”与“顾感受”之间切换，容易两边都不满意。",
        actionFocus: "关键决策采用“权重表”：逻辑60% + 关系40%（可调）。",
        reflectionPrompt: "最近一次你反复改口，是因为标准不清还是立场不稳？",
        metric: "记录每次决策的“逻辑权重/关系权重”",
        dayActionA: "选一件待决事项，先设权重再做判断。",
        dayActionB: "将一次沟通改写成“事实-影响-请求”三句式。",
        cue: "权重决策",
      };
    }

    return {
      dimension,
      score,
      volatility,
      trend,
      dominantSide,
      oppositeSide,
      riskType,
      riskScore,
      weaknessTitle: "情理切换波动",
      weaknessDetail: "同类议题中判断风格起伏较大，团队预期难稳定。",
      actionFocus: "建立“决策前30秒校准”：先确认标准，再进入沟通。",
      reflectionPrompt: "最近一次你在同类问题上前后标准不一，触发因素是什么？",
      metric: "记录“决策前校准”执行率与复盘满意度",
      dayActionA: "今天每次关键讨论前先写下“本次标准”。",
      dayActionB: "复盘一次标准变化，识别是压力、关系还是信息不足导致。",
      cue: "先校准标准",
    };
  }

  // JP
  if (riskType === "extreme" && score >= 0) {
    return {
      dimension,
      score,
      volatility,
      trend,
      dominantSide,
      oppositeSide,
      riskType,
      riskScore,
      weaknessTitle: "计划刚性过强",
      weaknessDetail: "收敛推进能力强，但可能降低弹性与新信息吸收速度。",
      actionFocus: "每天预留30分钟“无脚本探索”，允许方案调整。",
      reflectionPrompt: "最近一次你坚持原计划却错过更优解，信号是什么时候出现的？",
      metric: "记录“按计划执行”与“基于新信息调整”比例",
      dayActionA: "给当前计划设置1个“可调整检查点”。",
      dayActionB: "复盘一次临场变化，写下如果更早调整会怎样。",
      cue: "计划可调整",
    };
  }

  if (riskType === "extreme" && score < 0) {
    return {
      dimension,
      score,
      volatility,
      trend,
      dominantSide,
      oppositeSide,
      riskType,
      riskScore,
      weaknessTitle: "收尾能力欠稳",
      weaknessDetail: "探索弹性强，但可能在截止、收口与优先级上失焦。",
      actionFocus: "每天设置1个“必须收尾任务”，并绑定明确截止时间。",
      reflectionPrompt: "最近一次你拖到最后才冲刺，最早的预警信号是什么？",
      metric: "记录“必须收尾任务完成率”与“延期次数”",
      dayActionA: "今天先完成1件必须收尾任务，再开启探索任务。",
      dayActionB: "把一个开放任务切成“今天必做/可选延后”两栏。",
      cue: "先收尾再扩展",
    };
  }

  if (riskType === "indecision") {
    return {
      dimension,
      score,
      volatility,
      trend,
      dominantSide,
      oppositeSide,
      riskType,
      riskScore,
      weaknessTitle: "推进节奏犹豫",
      weaknessDetail: "在“先定再做”与“边做边调”间反复，导致执行效率下降。",
      actionFocus: "采用“15分钟决定法”：限定时间做当前最优决策。",
      reflectionPrompt: "最近一次你迟迟不定，是担心决策错误还是承担后果？",
      metric: "记录“15分钟决定法”执行次数与推进效率",
      dayActionA: "挑1件小决策，限定15分钟内拍板并执行。",
      dayActionB: "复盘一次延迟决策，写出下次可提前做的1步。",
      cue: "限时决策",
    };
  }

  return {
    dimension,
    score,
    volatility,
    trend,
    dominantSide,
    oppositeSide,
    riskType,
    riskScore,
    weaknessTitle: "执行节奏波动",
    weaknessDetail: "推进速度与计划稳定度起伏较大，产出质量受情境影响明显。",
    actionFocus: "建立“日计划-午检查-晚收尾”三段节奏，减少临场失控。",
    reflectionPrompt: "你最近一次节奏失控，是因为计划过满还是优先级混乱？",
    metric: "记录“中午检查完成率”与“当日收尾质量”",
    dayActionA: "今天中午做一次5分钟进度检查并重排优先级。",
    dayActionB: "晚间收尾时写下1条明天第一优先任务。",
    cue: "三段节奏",
  };
}

function trendActionSuggestion(trendValue: number, volatilityLevel: "low" | "medium" | "high") {
  if (volatilityLevel === "high") {
    return "本周优先“稳态化”，每天固定同一时段做复盘，先降波动再提强度。";
  }
  if (trendValue > 0.12) {
    return "近期执行取向走强，建议在推进前补1步关系校准，避免“效率高但摩擦大”。";
  }
  if (trendValue < -0.12) {
    return "近期探索取向走强，建议为每个新想法绑定最小可交付，避免只想不落地。";
  }
  return "趋势平稳期最适合精修习惯：保持1个确定性任务 + 1个探索性任务的双轨节奏。";
}

export function analyzePersonalityTrend(historyScores: TrendPoint[]) {
  if (!historyScores.length) {
    return {
      insights: [] as TrendInsight[],
      summary: "暂无历史数据，先完成一次测验。",
      diagnoses: [] as AxisDiagnosis[],
      primaryWeakness: null as AxisDiagnosis | null,
      secondaryWeakness: null as AxisDiagnosis | null,
      latestScores: null as DimensionScores | null,
    };
  }

  const dimensionSeries: Record<Dimension, number[]> = {
    EI: [],
    SN: [],
    TF: [],
    JP: [],
  };

  historyScores.forEach((item) => {
    DIMENSIONS.forEach((dimension) => dimensionSeries[dimension].push(item.scores[dimension]));
  });

  const longTermExtremity = mean(
    historyScores.flatMap((item) => DIMENSIONS.map((dimension) => Math.abs(item.scores[dimension]))),
  );
  const overallVolatility = mean(DIMENSIONS.map((dimension) => stdDev(dimensionSeries[dimension])));
  const recentWindow = historyScores.slice(-5);
  const recentSlope = mean(
    DIMENSIONS.map((dimension) => slope(recentWindow.map((row) => row.scores[dimension]))),
  );

  const insights: TrendInsight[] = [
    {
      label: "长期极端度",
      value: round(longTermExtremity, 4),
      level: level(longTermExtremity, 0.35, 0.65),
      summary:
        longTermExtremity > 0.65
          ? "你的偏好强度较高，优势清晰，但场景切换成本也更高。"
          : longTermExtremity < 0.35
            ? "你的适应性较强，但在关键时刻可能需要更快定向。"
            : "你的偏好强度处于平衡区间。",
    },
    {
      label: "波动幅度",
      value: round(overallVolatility, 4),
      level: level(overallVolatility, 0.18, 0.42),
      summary:
        overallVolatility > 0.42
          ? "近期波动较大，建议回看触发情境与压力源。"
          : overallVolatility < 0.18
            ? "整体稳定，可以进入更有挑战性的成长实验。"
            : "波动处于健康区间，可持续观察。",
    },
    {
      label: "近期趋势",
      value: round(recentSlope, 4),
      level: level(Math.abs(recentSlope), 0.05, 0.18),
      summary:
        recentSlope > 0.18
          ? "近期整体向 E/S/T/J 方向提升，执行取向增强。"
          : recentSlope < -0.18
            ? "近期整体向 I/N/F/P 方向移动，反思探索增强。"
            : "近期趋势温和，处于调整期。",
    },
  ];

  const latestScores = historyScores.at(-1)?.scores ?? null;
  const diagnoses = latestScores
    ? DIMENSIONS.map((dimension) =>
        buildAxisDiagnosis(
          dimension,
          latestScores[dimension],
          stdDev(dimensionSeries[dimension]),
          slope(recentWindow.map((row) => row.scores[dimension])),
        ),
      ).sort((a, b) => b.riskScore - a.riskScore)
    : [];

  const [primaryWeakness, secondaryWeakness] = diagnoses;

  return {
    insights,
    summary: `基于 ${historyScores.length} 次测验生成趋势分析。`,
    diagnoses,
    primaryWeakness: primaryWeakness ?? null,
    secondaryWeakness: secondaryWeakness ?? null,
    latestScores,
  };
}

export function generateAdvice(analysis: ReturnType<typeof analyzePersonalityTrend>) {
  const extreme = analysis.insights[0];
  const volatility = analysis.insights[1];
  const trend = analysis.insights[2];

  const primary = analysis.primaryWeakness;
  const secondary = analysis.secondaryWeakness ?? primary;

  if (!primary || !secondary) {
    return {
      actionSuggestions: [
        "先完成一次完整测验，系统会根据你的弱项生成针对性训练建议。",
        "本周先记录3次关键决策情境，作为个性化建议的输入。",
        "保持每天1次简短复盘，积累行为样本后再做精修。",
      ],
      reflectionQuestion: "你最近在哪个场景最容易偏离自己的节奏？当时是什么触发了你？",
      microPlan: [
        "Day1：记录今天一次关键决策的触发-反应-结果。",
        "Day2：回看昨天记录，找出一个可改进的微动作。",
        "Day3：在类似场景里尝试这个微动作并记录效果。",
        "Day4：与一位信任的人讨论你的观察。",
        "Day5：继续执行并补充第二条改进动作。",
        "Day6：做一次短测，查看变化。",
        "Day7：总结有效动作，形成下周执行清单。",
      ],
    };
  }

  const actions = [
    `核心弱点（${primary.dimension}）：${primary.weaknessTitle}。本周重点：${primary.actionFocus}`,
    `次级弱点（${secondary.dimension}）：${secondary.weaknessTitle}。补强动作：${secondary.actionFocus}`,
    trendActionSuggestion(trend?.value ?? 0, volatility?.level ?? "medium"),
  ];

  if (extreme?.level === "high") {
    actions[2] += " 同时每周安排1次“反偏好任务”，刻意练习你的对侧能力。";
  }

  const reflectionQuestion = `${primary.reflectionPrompt} 如果重来一次，你会在第几步改用“${primary.cue}”？`;

  const microPlan = [
    `Day1：建立基线（${primary.dimension}）：${primary.metric}。`,
    `Day2：主练习A：${primary.dayActionA}`,
    `Day3：主练习B：${primary.dayActionB}`,
    `Day4：次练习A（${secondary.dimension}）：${secondary.dayActionA}`,
    `Day5：次练习B（${secondary.dimension}）：${secondary.dayActionB}`,
    `Day6：完成一次短测并对比 ${primary.dimension}/${secondary.dimension} 两维变化。`,
    `Day7：总结本周最有效的2个动作，确定下周继续保留的1条规则（建议：${primary.cue}）。`,
  ];

  return {
    actionSuggestions: actions.slice(0, 3),
    reflectionQuestion,
    microPlan,
  };
}
