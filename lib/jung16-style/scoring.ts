import type { Jung16AnswerInput, Jung16Axis, Jung16AxisCounts, Jung16QuizItem, Jung16ScoreResult } from "@/lib/jung16-style/types";

type AxisPair = {
  key: Jung16Axis;
  first: string;
  second: string;
};

const AXIS_PAIRS: AxisPair[] = [
  { key: "EI", first: "E", second: "I" },
  { key: "SN", first: "S", second: "N" },
  { key: "TF", first: "T", second: "F" },
  { key: "JP", first: "J", second: "P" },
  { key: "AT", first: "A", second: "Turbulent" },
];

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function initCounts(): Record<Jung16Axis, Jung16AxisCounts> {
  return {
    EI: { total: 0, answered: 0 },
    SN: { total: 0, answered: 0 },
    TF: { total: 0, answered: 0 },
    JP: { total: 0, answered: 0 },
    AT: { total: 0, answered: 0 },
  };
}

function buildDefaultPMap() {
  return {
    EI: 0.5,
    SN: 0.5,
    TF: 0.5,
    JP: 0.5,
    AT: 0.5,
  };
}

export function scoreJung16Style(
  answers: Jung16AnswerInput[],
  items: Jung16QuizItem[],
): Jung16ScoreResult {
  const answerMap = new Map<string, number>();
  answers.forEach((answer) => {
    answerMap.set(answer.id, answer.answer);
  });

  const valuesByAxis: Record<Jung16Axis, number[]> = {
    EI: [],
    SN: [],
    TF: [],
    JP: [],
    AT: [],
  };
  const counts = initCounts();
  const missingItems: string[] = [];
  const invalidAnswers: string[] = [];
  let reversedCount = 0;

  items.forEach((item) => {
    counts[item.axis].total += 1;
    const answer = answerMap.get(item.id);
    if (typeof answer !== "number") {
      missingItems.push(item.id);
      return;
    }
    if (!Number.isInteger(answer) || answer < 1 || answer > 5) {
      invalidAnswers.push(item.id);
      return;
    }

    const value = item.keyed === "POS" ? answer : 6 - answer;
    if (item.keyed === "NEG") reversedCount += 1;

    valuesByAxis[item.axis].push(value);
    counts[item.axis].answered += 1;
  });

  const pMap = buildDefaultPMap();
  (["EI", "SN", "TF", "JP", "AT"] as const).forEach((axis) => {
    const values = valuesByAxis[axis];
    if (!values.length) return;
    const avg = values.reduce((sum, current) => sum + current, 0) / values.length;
    pMap[axis] = clamp01((avg - 1) / 4);
  });

  const confidence = {
    EI: clamp01(Math.abs(pMap.EI - 0.5) * 2),
    SN: clamp01(Math.abs(pMap.SN - 0.5) * 2),
    TF: clamp01(Math.abs(pMap.TF - 0.5) * 2),
    JP: clamp01(Math.abs(pMap.JP - 0.5) * 2),
    AT: counts.AT.total > 0 ? clamp01(Math.abs(pMap.AT - 0.5) * 2) : undefined,
  };

  const pick = (axis: Jung16Axis, first: string, second: string) => (pMap[axis] >= 0.5 ? first : second);
  const type4 = `${pick("EI", "E", "I")}${pick("SN", "S", "N")}${pick("TF", "T", "F")}${pick("JP", "J", "P")}`;
  const subtype = counts.AT.total > 0 ? `${type4}-${pick("AT", "A", "T")}` : undefined;

  const unreliableAxes = AXIS_PAIRS.filter((axis) => {
    const total = counts[axis.key].total;
    if (!total) return false;
    return counts[axis.key].answered < Math.ceil(total * 0.7);
  }).map((axis) => axis.key);

  return {
    axes: {
      E: pMap.EI,
      I: clamp01(1 - pMap.EI),
      S: pMap.SN,
      N: clamp01(1 - pMap.SN),
      T: pMap.TF,
      F: clamp01(1 - pMap.TF),
      J: pMap.JP,
      P: clamp01(1 - pMap.JP),
      ...(counts.AT.total > 0
        ? {
            A: pMap.AT,
            Turbulent: clamp01(1 - pMap.AT),
          }
        : {}),
    },
    type4,
    subtype,
    confidence: {
      EI: confidence.EI,
      SN: confidence.SN,
      TF: confidence.TF,
      JP: confidence.JP,
      ...(typeof confidence.AT === "number" ? { AT: confidence.AT } : {}),
    },
    unreliable: unreliableAxes.length > 0,
    needsSupplement: unreliableAxes.length > 0,
    debug: {
      perAxisCount: counts,
      reversedCount,
      missingItems,
      invalidAnswers,
      unreliableAxes,
    },
  };
}

