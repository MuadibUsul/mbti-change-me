import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AVATAR_LINE_VERSION } from "@/lib/avatar-line/types";
import type {
  AvatarConfig,
  AvatarRecord,
  AvatarStorageAdapter,
  AvatarStorageRecord,
} from "@/lib/avatar-line/types";
import { parseAvatarRecord } from "@/lib/avatar-line/storage";

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

export function readLineAvatarFromDerived(raw: unknown): AvatarRecord | null {
  const obj = asObject(raw);
  return parseAvatarRecord(obj.lineAvatar, obj.lineAvatarSvg);
}

export function writeLineAvatarToDerived(
  raw: unknown,
  record: AvatarRecord,
  keepHistory = true,
): Record<string, unknown> {
  const obj = { ...asObject(raw) };
  const history = Array.isArray(obj.lineAvatarHistory) ? [...obj.lineAvatarHistory] : [];
  const previous = parseAvatarRecord(obj.lineAvatar, obj.lineAvatarSvg);

  if (keepHistory && previous) {
    history.unshift(previous.config);
    obj.lineAvatarHistory = history.slice(0, 12);
  }

  obj.lineAvatar = record.config;
  obj.lineAvatarSvg = record.svg;
  return obj;
}

export function createPrismaAvatarStorageAdapter(params: {
  userId: string;
  sessionId?: string;
}): AvatarStorageAdapter {
  return {
    async getBySignature(input) {
      if (params.sessionId) {
        const token = await prisma.avatarToken.findFirst({
          where: {
            sessionId: params.sessionId,
            userId: params.userId,
          },
          select: { sessionId: true, derivedStats: true },
        });

        const line = readLineAvatarFromDerived(token?.derivedStats);
        if (
          line &&
          line.config.version === AVATAR_LINE_VERSION &&
          line.config.userId === input.userId &&
          line.config.mbti === input.mbti &&
          line.config.answersSignature === input.answersSignature
        ) {
          return {
            ...line,
            sessionId: token?.sessionId,
          };
        }
        return null;
      }

      const tokens = await prisma.avatarToken.findMany({
        where: { userId: params.userId },
        orderBy: { tokenIndex: "desc" },
        take: 20,
        select: { sessionId: true, derivedStats: true },
      });

      for (const token of tokens) {
        const line = readLineAvatarFromDerived(token.derivedStats);
        if (
          line &&
          line.config.version === AVATAR_LINE_VERSION &&
          line.config.userId === input.userId &&
          line.config.mbti === input.mbti &&
          line.config.answersSignature === input.answersSignature
        ) {
          return {
            ...line,
            sessionId: token.sessionId,
          };
        }
      }
      return null;
    },

    async save(record: AvatarStorageRecord) {
      const sessionId = record.sessionId ?? params.sessionId;
      if (!sessionId) return;

      const token = await prisma.avatarToken.findFirst({
        where: {
          sessionId,
          userId: params.userId,
        },
        select: {
          id: true,
          derivedStats: true,
        },
      });

      if (!token) return;

      const nextDerived = writeLineAvatarToDerived(token.derivedStats, record, true);
      await prisma.avatarToken.update({
        where: { id: token.id },
        data: {
          derivedStats: JSON.parse(JSON.stringify(nextDerived)) as Prisma.InputJsonValue,
        },
      });
    },
  };
}

export function parseLineAvatarConfig(raw: unknown): AvatarConfig | null {
  const line = readLineAvatarFromDerived(raw);
  return line?.config ?? null;
}

