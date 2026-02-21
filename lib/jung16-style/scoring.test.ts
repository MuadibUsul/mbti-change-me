import { describe, expect, it } from "vitest";
import { scoreJung16Style } from "./scoring";
import type { Jung16QuizItem } from "./types";

describe("scoreJung16Style", () => {
  it("applies NEG keyed reverse scoring correctly", () => {
    const items: Jung16QuizItem[] = [{ id: "EI01", axis: "EI", keyed: "NEG" }];
    const result = scoreJung16Style([{ id: "EI01", answer: 5 }], items);
    expect(result.axes.E).toBeCloseTo(0, 6);
    expect(result.axes.I).toBeCloseTo(1, 6);
    expect(result.type4[0]).toBe("I");
  });

  it("returns stable output for same input", () => {
    const items: Jung16QuizItem[] = [
      { id: "EI01", axis: "EI", keyed: "POS" },
      { id: "SN01", axis: "SN", keyed: "NEG" },
      { id: "TF01", axis: "TF", keyed: "POS" },
      { id: "JP01", axis: "JP", keyed: "NEG" },
    ];
    const answers = [
      { id: "EI01", answer: 4 },
      { id: "SN01", answer: 2 },
      { id: "TF01", answer: 5 },
      { id: "JP01", answer: 3 },
    ];

    const a = scoreJung16Style(answers, items);
    const b = scoreJung16Style(answers, items);

    expect(a).toEqual(b);
  });

  it("keeps axis p values clamped in 0..1", () => {
    const items: Jung16QuizItem[] = [
      { id: "EI01", axis: "EI", keyed: "POS" },
      { id: "SN01", axis: "SN", keyed: "POS" },
      { id: "TF01", axis: "TF", keyed: "POS" },
      { id: "JP01", axis: "JP", keyed: "POS" },
    ];
    const result = scoreJung16Style(
      [
        { id: "EI01", answer: 999 },
        { id: "SN01", answer: -2 },
        { id: "TF01", answer: 6 },
        { id: "JP01", answer: 0 },
      ],
      items,
    );

    expect(result.axes.E).toBeGreaterThanOrEqual(0);
    expect(result.axes.E).toBeLessThanOrEqual(1);
    expect(result.axes.S).toBeGreaterThanOrEqual(0);
    expect(result.axes.S).toBeLessThanOrEqual(1);
    expect(result.axes.T).toBeGreaterThanOrEqual(0);
    expect(result.axes.T).toBeLessThanOrEqual(1);
    expect(result.axes.J).toBeGreaterThanOrEqual(0);
    expect(result.axes.J).toBeLessThanOrEqual(1);
  });

  it("marks axis unreliable when answered count is below 70%", () => {
    const items: Jung16QuizItem[] = Array.from({ length: 10 }, (_, i) => ({
      id: `EI${i + 1}`,
      axis: "EI",
      keyed: "POS" as const,
    }));
    const answers = Array.from({ length: 6 }, (_, i) => ({
      id: `EI${i + 1}`,
      answer: 4,
    }));

    const result = scoreJung16Style(answers, items);
    expect(result.unreliable).toBe(true);
    expect(result.debug.unreliableAxes).toContain("EI");
    expect(result.needsSupplement).toBe(true);
  });
});
