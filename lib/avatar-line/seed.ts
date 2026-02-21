import { clamp } from "@/lib/math";
import type { AvatarAnswerInput, NormalizedAvatarAnswer } from "@/lib/avatar-line/types";

function normalizeOptionValue(input: AvatarAnswerInput): string {
  const raw = input.option ?? input.choice ?? input.value ?? "";
  const text = String(raw).trim();
  if (!text) return "0";
  return text.toUpperCase();
}

export function normalizeAnswers(answers: AvatarAnswerInput[]): NormalizedAvatarAnswer[] {
  return answers
    .filter((item) => typeof item.questionId === "string" && item.questionId.trim().length > 0)
    .map((item) => ({
      questionId: item.questionId.trim(),
      option: normalizeOptionValue(item),
    }));
}

export function buildAnswersSignature(answers: AvatarAnswerInput[]): string {
  const normalized = normalizeAnswers(answers);
  const sorted = [...normalized].sort((a, b) => a.questionId.localeCompare(b.questionId));
  return sorted.map((item) => `${item.questionId}:${item.option}`).join("|");
}

export function hash32(input: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function buildAvatarSeed(
  userId: string,
  mbti: string,
  answersSignature: string,
  variant = 0,
): number {
  const base = hash32(`${userId}|${mbti}|${answersSignature}`);
  return (base + (variant >>> 0)) >>> 0;
}

export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function randRange(rng: () => number, min: number, max: number) {
  return min + (max - min) * rng();
}

export function pickOne<T>(rng: () => number, list: T[]): T {
  const idx = Math.floor(clamp(rng(), 0, 0.999999) * list.length);
  return list[Math.max(0, Math.min(list.length - 1, idx))];
}

