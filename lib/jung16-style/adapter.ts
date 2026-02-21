import type { Dimension } from "@/lib/types";
import type { Jung16AnswerInput, Jung16Keyed, Jung16QuizItem } from "@/lib/jung16-style/types";

type SourceQuestion = {
  id: string;
  dimension: Dimension;
  direction: number;
  reverseScoring: boolean;
  text?: string;
};

type SourceAnswer = {
  questionId: string;
  choice: number;
};

function toKeyed(question: SourceQuestion): Jung16Keyed {
  const sign = (question.direction >= 0 ? 1 : -1) * (question.reverseScoring ? -1 : 1);
  return sign >= 0 ? "POS" : "NEG";
}

export function adaptToJung16Inputs(
  questions: SourceQuestion[],
  answers: SourceAnswer[],
): {
  items: Jung16QuizItem[];
  answers: Jung16AnswerInput[];
} {
  const items = questions.map((question) => ({
    id: question.id,
    axis: question.dimension,
    keyed: toKeyed(question),
    text: question.text,
  }));

  const answersMapped = answers.map((answer) => ({
    id: answer.questionId,
    answer: answer.choice,
  }));

  return {
    items,
    answers: answersMapped,
  };
}

