import "dotenv/config";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { generatePetModel, PET_PLACEHOLDER_SVG } from "../../lib/pet-model";
import { parseStyleDNA } from "../../lib/style-dna";
import type { BehaviorStats, Dimension, DimensionScores } from "../../lib/types";

function toScoreMap(rows: Array<{ dimension: Dimension; normalizedScore: number }>): DimensionScores {
  const result: DimensionScores = { EI: 0, SN: 0, TF: 0, JP: 0 };
  rows.forEach((row) => {
    result[row.dimension] = row.normalizedScore;
  });
  return result;
}

function defaultBehavior(): BehaviorStats {
  return {
    extremity: 0.5,
    consistency: 0.5,
    neutrality: 0.3,
    reverseSensitivity: 0.2,
  };
}

async function main() {
  const emailArg = process.argv.find((arg) => arg.startsWith("--email="));
  const email = emailArg ? emailArg.slice("--email=".length) : undefined;

  const tokens = await prisma.avatarToken.findMany({
    where: email
      ? {
          user: {
            email,
          },
        }
      : undefined,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          styleDNA: true,
        },
      },
      session: {
        select: {
          id: true,
          mbtiType: true,
          behaviorStats: true,
          dimensionScores: {
            select: {
              dimension: true,
              normalizedScore: true,
            },
          },
        },
      },
    },
    orderBy: [{ userId: "asc" }, { tokenIndex: "asc" }],
  });

  let updated = 0;
  let skipped = 0;

  for (const token of tokens) {
    const styleDNA = parseStyleDNA(token.user.styleDNA);
    if (!styleDNA || token.session.dimensionScores.length === 0) {
      skipped += 1;
      continue;
    }

    const scores = toScoreMap(
      token.session.dimensionScores.map((row) => ({
        dimension: row.dimension as Dimension,
        normalizedScore: row.normalizedScore,
      })),
    );

    const behavior =
      token.session.behaviorStats && typeof token.session.behaviorStats === "object"
        ? (token.session.behaviorStats as BehaviorStats)
        : defaultBehavior();

    try {
      const petModel = generatePetModel({
        userId: token.userId,
        sessionId: token.sessionId,
        mbti: token.session.mbtiType ?? "UNKN",
        styleDNA,
        scores,
        behavior,
      });

      const derivedStats =
        token.derivedStats && typeof token.derivedStats === "object"
          ? ({ ...(token.derivedStats as Record<string, unknown>) } as Record<string, unknown>)
          : {};

      delete derivedStats.pixelCharacter;
      derivedStats.petModel = petModel;

      const oldTraits = Array.isArray(derivedStats.traits)
        ? (derivedStats.traits as unknown[]).filter((item): item is string => typeof item === "string")
        : [];
      const normalizedTraits = oldTraits.length
        ? oldTraits
        : [petModel.species, petModel.mood, petModel.eyeStyle, petModel.accessory, petModel.featureTag];
      derivedStats.traits = normalizedTraits;

      await prisma.avatarToken.update({
        where: { id: token.id },
        data: {
          svg: PET_PLACEHOLDER_SVG,
          seed: petModel.seed,
          derivedStats: JSON.parse(JSON.stringify(derivedStats)) as Prisma.InputJsonValue,
        },
      });

      updated += 1;
    } catch {
      skipped += 1;
    }
  }

  console.log(`Backfill done. updated=${updated}, skipped=${skipped}, total=${tokens.length}`);
}

void main().finally(async () => {
  await prisma.$disconnect();
});
