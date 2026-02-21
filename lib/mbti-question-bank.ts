import rawBank from "../src/quizbank/jung16-style-v1.json";
import type { Dimension } from "@/lib/types";

export type Jung16Axis = Dimension | "AT";
export type Jung16Keyed = "POS" | "NEG";

export type Jung16StyleItem = {
  id: string;
  axis: Jung16Axis;
  keyed: Jung16Keyed;
  text: string;
};

export type Jung16StyleBank = {
  version: string;
  scale: {
    min: number;
    max: number;
    labels: string[];
  };
  items: Jung16StyleItem[];
};

export type MBTIQuestionItem = {
  code: string;
  text: string;
  dimension: Dimension;
  direction: 1 | -1;
  reverseScoring: boolean;
  intent: "baseline" | "depth";
  theme: string;
  axis: Jung16Axis;
  keyed: Jung16Keyed;
};

function isAxis(value: string): value is Jung16Axis {
  return value === "EI" || value === "SN" || value === "TF" || value === "JP" || value === "AT";
}

function normalizeBank(value: unknown): Jung16StyleBank {
  const fallback: Jung16StyleBank = {
    version: "jung16-style-v1",
    scale: { min: 1, max: 5, labels: ["1", "2", "3", "4", "5"] },
    items: [],
  };
  if (!value || typeof value !== "object") return fallback;
  const data = value as Record<string, unknown>;
  const scaleObj = data.scale && typeof data.scale === "object" ? (data.scale as Record<string, unknown>) : {};
  const itemsRaw = Array.isArray(data.items) ? data.items : [];

  const items: Jung16StyleItem[] = itemsRaw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const id = typeof row.id === "string" ? row.id : "";
      const axis = typeof row.axis === "string" && isAxis(row.axis) ? row.axis : null;
      const keyed = row.keyed === "POS" || row.keyed === "NEG" ? row.keyed : null;
      const text = typeof row.text === "string" ? row.text : "";
      if (!id || !axis || !keyed || !text) return null;
      return { id, axis, keyed, text };
    })
    .filter((item): item is Jung16StyleItem => !!item);

  return {
    version: typeof data.version === "string" ? data.version : fallback.version,
    scale: {
      min: typeof scaleObj.min === "number" ? scaleObj.min : 1,
      max: typeof scaleObj.max === "number" ? scaleObj.max : 5,
      labels: Array.isArray(scaleObj.labels) ? scaleObj.labels.filter((v): v is string => typeof v === "string") : fallback.scale.labels,
    },
    items,
  };
}

const BANK = normalizeBank(rawBank);

function toIntent(id: string): "baseline" | "depth" {
  const numberPart = Number.parseInt(id.slice(2), 10);
  if (Number.isNaN(numberPart)) return "baseline";
  return numberPart <= 6 ? "baseline" : "depth";
}

function toTheme(axis: Jung16Axis, keyed: Jung16Keyed) {
  return `${axis}-${keyed === "POS" ? "primary" : "reverse"}`;
}

export const JUNG16_STYLE_BANK = BANK;

export const MBTI_QUESTION_BANK: MBTIQuestionItem[] = BANK.items
  .filter((item) => item.axis !== "AT")
  .map((item) => ({
    code: item.id,
    text: item.text,
    dimension: item.axis as Dimension,
    direction: 1,
    reverseScoring: item.keyed === "NEG",
    intent: toIntent(item.id),
    theme: toTheme(item.axis, item.keyed),
    axis: item.axis,
    keyed: item.keyed,
  }));

export const QUESTION_BANK_INFO = {
  source: "Jung 16-style self-built bank (non-official)",
  itemCount: MBTI_QUESTION_BANK.length,
  authorityMode: "self-built",
  version: BANK.version,
} as const;
