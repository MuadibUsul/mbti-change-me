import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { QUESTION_BANK_INFO } from "@/lib/mbti-question-bank";
import { buildPersonaModel } from "@/lib/persona-model";
import { prisma } from "@/lib/prisma";
import { generateQuestions } from "@/lib/question-generator";
import type { Dimension, DimensionScores } from "@/lib/types";

const createSchema = z.object({
  count: z.number().int().min(20).max(60).default(36),
});

function toScoreMap(
  rows: Array<{
    dimension: string;
    normalizedScore: number;
  }>,
): DimensionScores {
  const map: DimensionScores = { EI: 0, SN: 0, TF: 0, JP: 0 };
  rows.forEach((row) => {
    const key = row.dimension as Dimension;
    if (key in map) map[key] = row.normalizedScore;
  });
  return map;
}

function makeGuestSessionId() {
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "题量参数不合法" }, { status: 400 });
    }

    if (!session?.user?.id) {
      const personaModel = buildPersonaModel([]);
      const generated = generateQuestions(parsed.data.count, `guest:${Date.now()}`, {
        personaModel,
        historyCount: 0,
        recentQuestionTexts: [],
        latestScores: null,
        latestBehavior: null,
      });

      return NextResponse.json({
        guest: true,
        sessionId: makeGuestSessionId(),
        startedAt: new Date().toISOString(),
        personaModel,
        questionBank: QUESTION_BANK_INFO,
        questions: generated.map((question) => ({
          id: question.id,
          text: question.text,
          dimension: question.dimension,
          direction: question.direction,
          reverseScoring: question.reverseScoring,
          choices: question.choices,
        })),
      });
    }

    const history = await prisma.testSession.findMany({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
      },
      orderBy: { createdAt: "asc" },
      take: 12,
      select: {
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

    const latestSession = history.at(-1);

    const recentQuestionRows = await prisma.question.findMany({
      where: {
        session: {
          userId: session.user.id,
          status: "COMPLETED",
        },
      },
      orderBy: { createdAt: "desc" },
      take: 120,
      select: {
        text: true,
      },
    });

    const personaModel = buildPersonaModel(history);
    const generated = generateQuestions(parsed.data.count, `${session.user.id}:${Date.now()}`, {
      personaModel,
      historyCount: history.length,
      recentQuestionTexts: recentQuestionRows.map((item) => item.text),
      latestScores: latestSession ? toScoreMap(latestSession.dimensionScores) : null,
      latestBehavior:
        latestSession?.behaviorStats && typeof latestSession.behaviorStats === "object"
          ? (latestSession.behaviorStats as {
              extremity?: number;
              consistency?: number;
              neutrality?: number;
              reverseSensitivity?: number;
            })
          : null,
    });

    const created = await prisma.testSession.create({
      data: {
        userId: session.user.id,
        questionCount: generated.length,
        questions: {
          create: generated.map((item, index) => ({
            orderIndex: index,
            text: item.text,
            dimension: item.dimension,
            direction: item.direction,
            reverseScoring: item.reverseScoring,
            choices: item.choices,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    return NextResponse.json({
      guest: false,
      sessionId: created.id,
      startedAt: created.startedAt,
      personaModel,
      questionBank: QUESTION_BANK_INFO,
      questions: created.questions.map((question) => ({
        id: question.id,
        text: question.text,
        dimension: question.dimension,
        direction: question.direction,
        reverseScoring: question.reverseScoring,
        choices: question.choices,
      })),
    });
  } catch (error) {
    console.error("create test session failed:", error);
    return NextResponse.json({ error: "创建测验失败" }, { status: 500 });
  }
}

