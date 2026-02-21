import { describe, expect, it } from "vitest";
import { analyzePersonalityTrend, generateAdvice } from "./mentor";
import type { DimensionScores } from "./types";

function scores(EI: number, SN: number, TF: number, JP: number): DimensionScores {
  return { EI, SN, TF, JP };
}

describe("mentor advice personalization", () => {
  it("generates non-fixed reflection and plan based on weak axis", () => {
    const analysis = analyzePersonalityTrend([
      { createdAt: "2026-01-01", scores: scores(-0.75, 0.1, -0.1, -0.8), mbti: "INFP" },
      { createdAt: "2026-01-10", scores: scores(-0.7, 0.15, -0.05, -0.78), mbti: "INFP" },
      { createdAt: "2026-01-20", scores: scores(-0.68, 0.2, -0.08, -0.82), mbti: "INFP" },
    ]);

    const advice = generateAdvice(analysis);

    expect(advice.reflectionQuestion).not.toContain("最近一次你表现得“不像自己”的时刻是什么");
    expect(advice.microPlan[0]).toContain("Day1：建立基线");
    expect(advice.microPlan[1]).toMatch(/Day2：主练习A：/);
  });

  it("changes suggestions when weakness profile changes", () => {
    const a = generateAdvice(
      analyzePersonalityTrend([
        { createdAt: "2026-01-01", scores: scores(0.82, 0.76, 0.7, 0.68), mbti: "ESTJ" },
        { createdAt: "2026-01-15", scores: scores(0.84, 0.73, 0.74, 0.7), mbti: "ESTJ" },
      ]),
    );

    const b = generateAdvice(
      analyzePersonalityTrend([
        { createdAt: "2026-01-01", scores: scores(-0.2, -0.82, -0.76, -0.72), mbti: "INFP" },
        { createdAt: "2026-01-15", scores: scores(-0.25, -0.8, -0.78, -0.75), mbti: "INFP" },
      ]),
    );

    expect(a.actionSuggestions[0]).not.toBe(b.actionSuggestions[0]);
    expect(a.reflectionQuestion).not.toBe(b.reflectionQuestion);
  });
});
