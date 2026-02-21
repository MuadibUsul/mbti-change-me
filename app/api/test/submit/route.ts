import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { calculateBehaviorStats } from "@/lib/behavior-stats";
import { adaptToJung16Inputs, scoreJung16Style } from "@/lib/jung16-style";
import { analyzePersonalityTrend, generateAdvice } from "@/lib/mentor";
import { generatePetModel, PET_PLACEHOLDER_SVG } from "@/lib/pet-model";
import { buildPersonaModel } from "@/lib/persona-model";
import { prisma } from "@/lib/prisma";
import { scoreSession, type ScoringAnswer, type ScoringQuestion } from "@/lib/scoring";
import { generateStyleDNA, parseStyleDNA } from "@/lib/style-dna";
import type { Dimension, DimensionScores } from "@/lib/types";

const submitSchema = z.object({
  sessionId: z.string().min(1),
  questions: z
    .array(
      z.object({
        id: z.string().min(1),
        dimension: z.enum(["EI", "SN", "TF", "JP"]),
        direction: z.number().int(),
        reverseScoring: z.boolean(),
      }),
    )
    .optional(),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      choice: z.number().int().min(1).max(5),
      elapsedMs: z.number().int().min(0).optional(),
    }),
  ),
});

function toScoreMap(rows: { dimension: Dimension; normalizedScore: number }[]): DimensionScores {
  const map: DimensionScores = { EI: 0, SN: 0, TF: 0, JP: 0 };
  rows.forEach((row) => {
    map[row.dimension] = row.normalizedScore;
  });
  return map;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function round4(value: number) {
  return Math.round(value * 10000) / 10000;
}

function toHsl(color?: { h: number; s: number; l: number }) {
  if (!color) return "hsl(0 0% 60%)";
  return `hsl(${Math.round(color.h)} ${Math.round(color.s)}% ${Math.round(color.l)}%)`;
}

function guestSessionResponse(parsed: z.infer<typeof submitSchema>) {
  if (!parsed.sessionId.startsWith("guest_")) {
    return NextResponse.json({ error: "游客会话参数无效" }, { status: 400 });
  }
  if (!parsed.questions?.length) {
    return NextResponse.json({ error: "游客会话缺少题目上下文" }, { status: 400 });
  }
  if (parsed.answers.length !== parsed.questions.length) {
    return NextResponse.json({ error: "请完成全部题目后再提交" }, { status: 400 });
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "提交参数不合法", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { sessionId, answers } = parsed.data;
    const isGuest = !session?.user?.id;

    if (isGuest) {
      const guestErr = guestSessionResponse(parsed.data);
      if (guestErr) return guestErr;

      const scoringQuestions: ScoringQuestion[] = parsed.data.questions!.map((q) => ({
        id: q.id,
        dimension: q.dimension as Dimension,
        direction: q.direction as 1 | -1,
        reverseScoring: q.reverseScoring,
      }));
      const scoringAnswers: ScoringAnswer[] = answers.map((a) => ({
        questionId: a.questionId,
        choice: a.choice,
      }));

      const scoreResult = scoreSession(scoringQuestions, scoringAnswers);
      const jung16Input = adaptToJung16Inputs(
        scoringQuestions.map((question) => ({
          id: question.id,
          dimension: question.dimension,
          direction: question.direction,
          reverseScoring: question.reverseScoring,
        })),
        scoringAnswers,
      );
      const jung16Result = scoreJung16Style(jung16Input.answers, jung16Input.items);
      const completionSeconds = Math.max(
        1,
        Math.round(
          answers.reduce((acc, item) => acc + (item.elapsedMs ?? 3500), 0) / 1000,
        ),
      );
      const behaviorStats = calculateBehaviorStats(scoringQuestions, scoringAnswers, completionSeconds);
      const styleDNA = generateStyleDNA({
        userId: "guest-user",
        sessionId,
        scores: scoreResult.normalizedScores,
        behavior: behaviorStats,
      });
      const petModel = generatePetModel({
        userId: "guest-user",
        sessionId,
        mbti: scoreResult.mbti,
        styleDNA,
        scores: scoreResult.normalizedScores,
        behavior: behaviorStats,
      });
      const personaModel = buildPersonaModel([
        {
          mbtiType: scoreResult.mbti,
          behaviorStats,
          dimensionScores: (["EI", "SN", "TF", "JP"] as const).map((dimension) => ({
            dimension,
            normalizedScore: scoreResult.normalizedScores[dimension],
          })),
        },
      ]);

      const regions = {
        head: clamp01(Math.abs(scoreResult.normalizedScores[styleDNA.regionMap.head])),
        chest: clamp01(Math.abs(scoreResult.normalizedScores[styleDNA.regionMap.chest])),
        belly: clamp01(Math.abs(scoreResult.normalizedScores[styleDNA.regionMap.belly])),
        armL: clamp01(Math.abs(scoreResult.normalizedScores[styleDNA.regionMap.armL])),
        armR: clamp01(Math.abs(scoreResult.normalizedScores[styleDNA.regionMap.armR])),
        legL: clamp01(Math.abs(scoreResult.normalizedScores[styleDNA.regionMap.legL])),
        legR: clamp01(Math.abs(scoreResult.normalizedScores[styleDNA.regionMap.legR])),
        aura: clamp01(Math.abs(scoreResult.normalizedScores[styleDNA.regionMap.aura])),
      };

      const byDimension = {
        EI: styleDNA.basePalette[0],
        SN: styleDNA.basePalette[1],
        TF: styleDNA.basePalette[2],
        JP: styleDNA.basePalette[3],
      } as const;

      const regionColors = {
        head: toHsl(byDimension[styleDNA.regionMap.head]),
        chest: toHsl(byDimension[styleDNA.regionMap.chest]),
        belly: toHsl(byDimension[styleDNA.regionMap.belly]),
        armL: toHsl(byDimension[styleDNA.regionMap.armL]),
        armR: toHsl(byDimension[styleDNA.regionMap.armR]),
        legL: toHsl(byDimension[styleDNA.regionMap.legL]),
        legR: toHsl(byDimension[styleDNA.regionMap.legR]),
        aura: toHsl(byDimension[styleDNA.regionMap.aura]),
      };

      const derivedStats = {
        mbti: scoreResult.mbti,
        jung16: jung16Result,
        contrast: round4(clamp01(behaviorStats.extremity * (1 - behaviorStats.neutrality))),
        harmony: round4(clamp01(behaviorStats.consistency * (1 - behaviorStats.reverseSensitivity * 0.45))),
        volatility: round4(clamp01((1 - behaviorStats.consistency) * 0.6 + behaviorStats.reverseSensitivity * 0.8)),
        archetype: personaModel.archetype,
        traits: [petModel.species, petModel.mood, petModel.eyeStyle, petModel.accessory, petModel.featureTag],
        petModel,
      };

      const trendAnalysis = analyzePersonalityTrend([
        {
          createdAt: new Date().toISOString(),
          scores: scoreResult.normalizedScores,
          mbti: scoreResult.mbti,
        },
      ]);
      const advice = generateAdvice(trendAnalysis);

      return NextResponse.json({
        guest: true,
        sessionId,
        mbti: scoreResult.mbti,
        jung16: jung16Result,
        scores: scoreResult.normalizedScores,
        behaviorStats,
        styleDNA,
        personaModel,
        avatarToken: {
          seed: petModel.seed,
          regions,
          regionColors,
          textureOverlay: styleDNA.texture,
          derivedStats: {
            ...derivedStats,
            personaModel,
          },
          svg: PET_PLACEHOLDER_SVG,
        },
        mentor: {
          insights: trendAnalysis.insights,
          ...advice,
        },
      });
    }

    const testSession = await prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        user: true,
        questions: {
          orderBy: { orderIndex: "asc" },
        },
        avatarToken: true,
      },
    });

    if (!testSession || testSession.userId !== session.user.id) {
      return NextResponse.json({ error: "测验不存在" }, { status: 404 });
    }

    if (!testSession.questions.length) {
      return NextResponse.json({ error: "当前测验没有题目" }, { status: 400 });
    }

    const questionMap = new Map(testSession.questions.map((q) => [q.id, q]));
    if (answers.length !== testSession.questions.length) {
      return NextResponse.json({ error: "请完成全部题目后再提交" }, { status: 400 });
    }

    const scoringQuestions: ScoringQuestion[] = testSession.questions.map((q) => ({
      id: q.id,
      dimension: q.dimension as Dimension,
      direction: q.direction,
      reverseScoring: q.reverseScoring,
    }));

    const scoringAnswers: ScoringAnswer[] = answers.map((a) => ({
      questionId: a.questionId,
      choice: a.choice,
    }));

    const scoreResult = scoreSession(scoringQuestions, scoringAnswers);
    const jung16Input = adaptToJung16Inputs(
      testSession.questions.map((question) => ({
        id: question.id,
        dimension: question.dimension as Dimension,
        direction: question.direction,
        reverseScoring: question.reverseScoring,
        text: question.text,
      })),
      scoringAnswers,
    );
    const jung16Result = scoreJung16Style(jung16Input.answers, jung16Input.items);
    const completionSeconds = Math.max(
      1,
      Math.round((Date.now() - new Date(testSession.startedAt).getTime()) / 1000),
    );
    const behaviorStats = calculateBehaviorStats(scoringQuestions, scoringAnswers, completionSeconds);

    let styleDNA = parseStyleDNA(testSession.user.styleDNA);
    const shouldCreateDNA = !styleDNA;
    const userHasCompanion =
      !!testSession.user.styleDNA &&
      typeof testSession.user.styleDNA === "object" &&
      "companion" in (testSession.user.styleDNA as Record<string, unknown>);
    const shouldUpdateExistingDNA = !!styleDNA && !userHasCompanion;

    if (!styleDNA) {
      styleDNA = generateStyleDNA({
        userId: testSession.userId,
        sessionId: testSession.id,
        scores: scoreResult.normalizedScores,
        behavior: behaviorStats,
      });
    }

    let tokenIndex = testSession.avatarToken?.tokenIndex;
    if (!tokenIndex) {
      const latest = await prisma.avatarToken.findFirst({
        where: { userId: testSession.userId },
        orderBy: { tokenIndex: "desc" },
      });
      tokenIndex = (latest?.tokenIndex ?? 0) + 1;
    }

    const historySessions = await prisma.testSession.findMany({
      where: {
        userId: testSession.userId,
        status: "COMPLETED",
        id: { not: testSession.id },
      },
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
        mbtiType: true,
        behaviorStats: true,
        dimensionScores: true,
      },
    });

    const historyPoints = historySessions.map((item) => ({
      createdAt: item.createdAt.toISOString(),
      scores: toScoreMap(
        item.dimensionScores.map((score) => ({
          dimension: score.dimension as Dimension,
          normalizedScore: score.normalizedScore,
        })),
      ),
      mbti: item.mbtiType ?? undefined,
    }));

    const personaModel = buildPersonaModel([
      ...historySessions.map((item) => ({
        mbtiType: item.mbtiType,
        behaviorStats: item.behaviorStats,
        dimensionScores: item.dimensionScores.map((score) => ({
          dimension: score.dimension,
          normalizedScore: score.normalizedScore,
        })),
      })),
      {
        mbtiType: scoreResult.mbti,
        behaviorStats,
        dimensionScores: (["EI", "SN", "TF", "JP"] as const).map((dimension) => ({
          dimension,
          normalizedScore: scoreResult.normalizedScores[dimension],
        })),
      },
    ]);

    const regions = {
      head: clamp01(Math.abs(scoreResult.normalizedScores[styleDNA.regionMap.head])),
      chest: clamp01(Math.abs(scoreResult.normalizedScores[styleDNA.regionMap.chest])),
      belly: clamp01(Math.abs(scoreResult.normalizedScores[styleDNA.regionMap.belly])),
      armL: clamp01(Math.abs(scoreResult.normalizedScores[styleDNA.regionMap.armL])),
      armR: clamp01(Math.abs(scoreResult.normalizedScores[styleDNA.regionMap.armR])),
      legL: clamp01(Math.abs(scoreResult.normalizedScores[styleDNA.regionMap.legL])),
      legR: clamp01(Math.abs(scoreResult.normalizedScores[styleDNA.regionMap.legR])),
      aura: clamp01(Math.abs(scoreResult.normalizedScores[styleDNA.regionMap.aura])),
    };

    const byDimension = {
      EI: styleDNA.basePalette[0],
      SN: styleDNA.basePalette[1],
      TF: styleDNA.basePalette[2],
      JP: styleDNA.basePalette[3],
    } as const;

    const regionColors = {
      head: toHsl(byDimension[styleDNA.regionMap.head]),
      chest: toHsl(byDimension[styleDNA.regionMap.chest]),
      belly: toHsl(byDimension[styleDNA.regionMap.belly]),
      armL: toHsl(byDimension[styleDNA.regionMap.armL]),
      armR: toHsl(byDimension[styleDNA.regionMap.armR]),
      legL: toHsl(byDimension[styleDNA.regionMap.legL]),
      legR: toHsl(byDimension[styleDNA.regionMap.legR]),
      aura: toHsl(byDimension[styleDNA.regionMap.aura]),
    };

    const petModel = generatePetModel({
      userId: testSession.userId,
      sessionId: testSession.id,
      mbti: scoreResult.mbti,
      styleDNA,
      scores: scoreResult.normalizedScores,
      behavior: behaviorStats,
    });

    const derivedStats = {
      mbti: scoreResult.mbti,
      jung16: jung16Result,
      contrast: round4(clamp01(behaviorStats.extremity * (1 - behaviorStats.neutrality))),
      harmony: round4(clamp01(behaviorStats.consistency * (1 - behaviorStats.reverseSensitivity * 0.45))),
      volatility: round4(clamp01((1 - behaviorStats.consistency) * 0.6 + behaviorStats.reverseSensitivity * 0.8)),
      archetype: personaModel.archetype,
      traits: [petModel.species, petModel.mood, petModel.eyeStyle, petModel.accessory, petModel.featureTag],
      petModel,
    };

    const trendAnalysis = analyzePersonalityTrend([
      ...historyPoints,
      {
        createdAt: new Date().toISOString(),
        scores: scoreResult.normalizedScores,
        mbti: scoreResult.mbti,
      },
    ]);
    const advice = generateAdvice(trendAnalysis);

    await prisma.$transaction(async (tx) => {
      await tx.answer.deleteMany({ where: { sessionId: testSession.id } });

      await tx.answer.createMany({
        data: answers
          .filter((answer) => questionMap.has(answer.questionId))
          .map((answer) => ({
            sessionId: testSession.id,
            questionId: answer.questionId,
            userId: testSession.userId,
            choice: answer.choice,
            mappedValue: scoreResult.answerMappedValues[answer.questionId] ?? 0,
            elapsedMs: answer.elapsedMs ?? null,
          })),
      });

      await Promise.all(
        (["EI", "SN", "TF", "JP"] as const).map((dimension) =>
          tx.dimensionScore.upsert({
            where: {
              sessionId_dimension: {
                sessionId: testSession.id,
                dimension,
              },
            },
            create: {
              sessionId: testSession.id,
              dimension,
              rawScore: scoreResult.rawScores[dimension],
              normalizedScore: scoreResult.normalizedScores[dimension],
              letter: scoreResult.letters[dimension],
            },
            update: {
              rawScore: scoreResult.rawScores[dimension],
              normalizedScore: scoreResult.normalizedScores[dimension],
              letter: scoreResult.letters[dimension],
            },
          }),
        ),
      );

      await tx.testSession.update({
        where: { id: testSession.id },
        data: {
          status: "COMPLETED",
          mbtiType: scoreResult.mbti,
          completedAt: new Date(),
          completionSeconds,
          behaviorStats,
        },
      });

      if (shouldCreateDNA || shouldUpdateExistingDNA) {
        await tx.user.update({
          where: { id: testSession.userId },
          data: { styleDNA },
        });
      }

      await tx.avatarToken.upsert({
        where: { sessionId: testSession.id },
        create: {
          sessionId: testSession.id,
          userId: testSession.userId,
          tokenIndex,
          seed: petModel.seed,
          regions,
          regionColors,
          textureOverlay: styleDNA.texture,
          derivedStats: {
            ...derivedStats,
            personaModel,
          },
          svg: PET_PLACEHOLDER_SVG,
        },
        update: {
          seed: petModel.seed,
          regions,
          regionColors,
          textureOverlay: styleDNA.texture,
          derivedStats: {
            ...derivedStats,
            personaModel,
          },
          svg: PET_PLACEHOLDER_SVG,
        },
      });

      await tx.mentorAdvice.upsert({
        where: { sessionId: testSession.id },
        create: {
          sessionId: testSession.id,
          userId: testSession.userId,
          insights: trendAnalysis.insights,
          actionSuggestions: advice.actionSuggestions,
          reflectionQuestion: advice.reflectionQuestion,
          microPlan: advice.microPlan,
        },
        update: {
          insights: trendAnalysis.insights,
          actionSuggestions: advice.actionSuggestions,
          reflectionQuestion: advice.reflectionQuestion,
          microPlan: advice.microPlan,
        },
      });
    });

    return NextResponse.json({
      guest: false,
      sessionId: testSession.id,
      mbti: scoreResult.mbti,
      jung16: jung16Result,
      scores: scoreResult.normalizedScores,
      behaviorStats,
      styleDNA,
      personaModel,
      avatarToken: {
        seed: petModel.seed,
        regions,
        regionColors,
        textureOverlay: styleDNA.texture,
        derivedStats: {
          ...derivedStats,
          personaModel,
        },
        svg: PET_PLACEHOLDER_SVG,
      },
      mentor: {
        insights: trendAnalysis.insights,
        ...advice,
      },
    });
  } catch (error) {
    console.error("submit test failed:", error);
    return NextResponse.json({ error: "提交测验失败" }, { status: 500 });
  }
}
