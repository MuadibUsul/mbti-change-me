import type { Dimension } from "@/lib/types";

export type Jung16Axis = Dimension | "AT";
export type Jung16Keyed = "POS" | "NEG";

export type Jung16QuizItem = {
  id: string;
  axis: Jung16Axis;
  keyed: Jung16Keyed;
  text?: string;
};

export type Jung16AnswerInput = {
  id: string;
  answer: number;
};

export type Jung16AxisCounts = {
  total: number;
  answered: number;
};

export type Jung16AxisPercents = {
  E: number;
  I: number;
  S: number;
  N: number;
  T: number;
  F: number;
  J: number;
  P: number;
  A?: number;
  Turbulent?: number;
};

export type Jung16Confidence = {
  EI: number;
  SN: number;
  TF: number;
  JP: number;
  AT?: number;
};

export type Jung16ScoreResult = {
  axes: Jung16AxisPercents;
  type4: string;
  subtype?: string;
  confidence: Jung16Confidence;
  unreliable: boolean;
  needsSupplement: boolean;
  debug: {
    perAxisCount: Record<Jung16Axis, Jung16AxisCounts>;
    reversedCount: number;
    missingItems: string[];
    invalidAnswers: string[];
    unreliableAxes: Jung16Axis[];
  };
};

