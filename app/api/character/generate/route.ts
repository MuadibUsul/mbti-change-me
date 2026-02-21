import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { generatePetModel } from "@/lib/pet-model";
import { prisma } from "@/lib/prisma";
import { parseStyleDNA } from "@/lib/style-dna";
import type { BehaviorStats, Dimension, DimensionScores } from "@/lib/types";

const requestSchema = z.object({
  seed: z.string().min(1).optional(),
});

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

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "参数不合法" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { styleDNA: true },
    });
    const styleDNA = parseStyleDNA(user?.styleDNA ?? null);
    if (!styleDNA) {
      return NextResponse.json({ error: "尚未生成视觉基因，请先完成一次测验" }, { status: 400 });
    }

    const latestCompleted = await prisma.testSession.findFirst({
      where: { userId: session.user.id, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
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
    });

    if (!latestCompleted?.dimensionScores.length) {
      return NextResponse.json({ error: "缺少最近一次测验分数" }, { status: 400 });
    }

    const scores = toScoreMap(
      latestCompleted.dimensionScores.map((row) => ({
        dimension: row.dimension as Dimension,
        normalizedScore: row.normalizedScore,
      })),
    );
    const behavior =
      latestCompleted.behaviorStats && typeof latestCompleted.behaviorStats === "object"
        ? (latestCompleted.behaviorStats as BehaviorStats)
        : defaultBehavior();

    const petModel = generatePetModel({
      userId: session.user.id,
      sessionId: parsed.data.seed ? `manual:${parsed.data.seed}` : latestCompleted.id,
      mbti: latestCompleted.mbtiType ?? "UNKN",
      styleDNA,
      scores,
      behavior,
    });

    return NextResponse.json({
      seed: petModel.seed,
      petModel,
      traits: [petModel.species, petModel.mood, petModel.eyeStyle, petModel.accessory, petModel.featureTag],
    });
  } catch (error) {
    console.error("generate character failed:", error);
    return NextResponse.json({ error: "生成人格形象失败" }, { status: 500 });
  }
}
