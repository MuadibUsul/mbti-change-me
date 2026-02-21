import { selectAccessories, selectBackgroundGlyph } from "@/lib/avatar-line/accessories";
import { buildPalette } from "@/lib/avatar-line/palette";
import { selectPose } from "@/lib/avatar-line/poses";
import { renderAvatarSVG } from "@/lib/avatar-line/rendererSvg";
import { buildAnswersSignature, buildAvatarSeed, mulberry32 } from "@/lib/avatar-line/seed";
import { selectStyleProfile } from "@/lib/avatar-line/styles";
import { AVATAR_LINE_VERSION } from "@/lib/avatar-line/types";
import type {
  AvatarAnswerInput,
  AvatarConfig,
  AvatarRecord,
  AvatarStorageAdapter,
} from "@/lib/avatar-line/types";
import { buildTraitVector } from "@/lib/avatar-line/traits";

type GetOrCreateAvatarInput = {
  userId: string;
  mbti: string;
  answers: AvatarAnswerInput[];
  storage?: AvatarStorageAdapter;
  sessionId?: string;
  existingConfig?: AvatarConfig | null;
};

function composeConfig(input: {
  userId: string;
  mbti: string;
  answersSignature: string;
  traitVector: AvatarConfig["traitVector"];
  seed: number;
  variant: number;
}) {
  const rng = mulberry32(input.seed);
  const style = selectStyleProfile(input.traitVector, rng);
  const pose = selectPose(input.traitVector, rng);
  const accessories = selectAccessories(input.traitVector, input.mbti, rng);
  const backgroundGlyph = selectBackgroundGlyph(input.traitVector, rng);
  const palette = buildPalette(input.mbti, input.traitVector, style);

  return {
    version: AVATAR_LINE_VERSION,
    userId: input.userId,
    mbti: input.mbti,
    seed: input.seed,
    variant: input.variant,
    answersSignature: input.answersSignature,
    traitVector: input.traitVector,
    styleProfileId: style.id,
    poseId: pose.id,
    accessories,
    backgroundGlyph,
    palette,
  } satisfies AvatarConfig;
}

export async function getOrCreateAvatar(input: GetOrCreateAvatarInput): Promise<AvatarRecord> {
  const answersSignature = buildAnswersSignature(input.answers);

  if (
    input.existingConfig &&
    input.existingConfig.version === AVATAR_LINE_VERSION &&
    input.existingConfig.userId === input.userId &&
    input.existingConfig.mbti === input.mbti &&
    input.existingConfig.answersSignature === answersSignature
  ) {
    return {
      config: input.existingConfig,
      svg: renderAvatarSVG(input.existingConfig),
    };
  }

  if (input.storage) {
    const existing = await input.storage.getBySignature({
      userId: input.userId,
      mbti: input.mbti,
      answersSignature,
      version: AVATAR_LINE_VERSION,
      sessionId: input.sessionId,
    });
    if (existing) {
      return {
        config: existing.config,
        svg: existing.svg,
      };
    }
  }

  const traitVector = buildTraitVector(input.mbti, input.answers);
  const seed = buildAvatarSeed(input.userId, input.mbti, answersSignature, 0);
  const config = composeConfig({
    userId: input.userId,
    mbti: input.mbti,
    answersSignature,
    traitVector,
    seed,
    variant: 0,
  });
  const svg = renderAvatarSVG(config);
  const record: AvatarRecord = { config, svg };

  if (input.storage) {
    await input.storage.save({
      ...record,
      sessionId: input.sessionId,
    });
  }

  return record;
}

export async function regenerateVariant(
  config: AvatarConfig,
  storage?: AvatarStorageAdapter,
  sessionId?: string,
): Promise<AvatarRecord> {
  const nextSeed = (config.seed + 1) >>> 0;
  const nextConfig = composeConfig({
    userId: config.userId,
    mbti: config.mbti,
    answersSignature: config.answersSignature,
    traitVector: config.traitVector,
    seed: nextSeed,
    variant: config.variant + 1,
  });
  const svg = renderAvatarSVG(nextConfig);
  const record: AvatarRecord = { config: nextConfig, svg };

  if (storage) {
    await storage.save({
      ...record,
      sessionId,
    });
  }

  return record;
}

export function parseAvatarConfig(raw: unknown): AvatarConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as AvatarConfig;
  if (value.version !== AVATAR_LINE_VERSION) return null;
  if (!value.userId || !value.mbti || !value.answersSignature) return null;
  if (typeof value.seed !== "number" || typeof value.variant !== "number") return null;
  if (!value.traitVector || typeof value.traitVector !== "object") return null;
  return value;
}

export type {
  AvatarAnswerInput,
  AvatarConfig,
  AvatarRecord,
  AvatarStorageAdapter,
  TraitVector,
  StyleProfileId,
  PoseId,
} from "@/lib/avatar-line/types";

