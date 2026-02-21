import { AVATAR_LINE_VERSION } from "@/lib/avatar-line/types";
import type {
  AvatarConfig,
  AvatarRecord,
  AvatarStorageAdapter,
  AvatarStorageRecord,
} from "@/lib/avatar-line/types";

export function isAvatarConfig(value: unknown): value is AvatarConfig {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    row.version === AVATAR_LINE_VERSION &&
    typeof row.userId === "string" &&
    typeof row.mbti === "string" &&
    typeof row.seed === "number" &&
    typeof row.variant === "number" &&
    typeof row.answersSignature === "string" &&
    typeof row.styleProfileId === "string" &&
    typeof row.poseId === "string" &&
    Array.isArray(row.accessories) &&
    typeof row.backgroundGlyph === "string" &&
    typeof row.palette === "object"
  );
}

export function parseAvatarRecord(rawConfig: unknown, rawSvg: unknown): AvatarRecord | null {
  if (!isAvatarConfig(rawConfig)) return null;
  if (typeof rawSvg !== "string" || !rawSvg.includes("<svg")) return null;
  return {
    config: rawConfig,
    svg: rawSvg,
  };
}

export function buildLineAvatarStorageKey(input: {
  userId: string;
  mbti: string;
  answersSignature: string;
}) {
  return `${AVATAR_LINE_VERSION}:${input.userId}:${input.mbti}:${input.answersSignature}`;
}

export function createLocalStorageAdapter(storageKeyPrefix = AVATAR_LINE_VERSION): AvatarStorageAdapter {
  return {
    async getBySignature(input) {
      if (typeof window === "undefined") return null;
      const key = `${storageKeyPrefix}:${buildLineAvatarStorageKey(input)}`;
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as AvatarStorageRecord;
        if (!parsed || typeof parsed !== "object") return null;
        if (!isAvatarConfig(parsed.config)) return null;
        if (typeof parsed.svg !== "string") return null;
        return parsed;
      } catch {
        return null;
      }
    },
    async save(record) {
      if (typeof window === "undefined") return;
      const key = `${storageKeyPrefix}:${buildLineAvatarStorageKey(record.config)}`;
      window.localStorage.setItem(key, JSON.stringify(record));
    },
  };
}

