import { describe, expect, it } from "vitest";
import { MBTI_QUESTION_BANK } from "./mbti-question-bank";
import { generateQuestions } from "./question-generator";

describe("question generator compatibility", () => {
  it("uses bank original text without warm prefix", () => {
    const textSet = new Set(MBTI_QUESTION_BANK.map((item) => item.text));
    const questions = generateQuestions(36, "qa-seed-1", {
      historyCount: 6,
      recentQuestionTexts: [],
      latestScores: { EI: 0.1, SN: -0.2, TF: 0.3, JP: -0.1 },
      latestBehavior: { consistency: 0.5, extremity: 0.4, neutrality: 0.2, reverseSensitivity: 0.1 },
      personaModel: null,
    });

    expect(questions).toHaveLength(36);
    questions.forEach((question) => {
      expect(textSet.has(question.text)).toBe(true);
      expect(question.text.startsWith("多数时候：")).toBe(false);
      expect(question.text.startsWith("通常情况下：")).toBe(false);
      expect(question.text.startsWith("在你熟悉的节奏里：")).toBe(false);
    });
  });

  it("does not inject followup item codes", () => {
    const questions = generateQuestions(36, "qa-seed-2", {
      historyCount: 12,
      recentQuestionTexts: [],
      latestScores: { EI: 0.2, SN: 0.2, TF: 0.2, JP: 0.2 },
      latestBehavior: { consistency: 0.7, extremity: 0.6, neutrality: 0.2, reverseSensitivity: 0.1 },
      personaModel: null,
    });

    questions.forEach((question) => {
      expect(question.id.includes("_FU")).toBe(false);
    });
  });
});

