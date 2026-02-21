import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, type Dimension } from "@prisma/client";
import seedrandom from "seedrandom";
import { calculateBehaviorStats } from "../lib/behavior-stats";
import { analyzePersonalityTrend, generateAdvice } from "../lib/mentor";
import { buildPersonaModel } from "../lib/persona-model";
import { generatePetModel, PET_PLACEHOLDER_SVG } from "../lib/pet-model";
import { generateQuestions } from "../lib/question-generator";
import { scoreSession, type ScoringAnswer, type ScoringQuestion } from "../lib/scoring";
import { generateStyleDNA, parseStyleDNA } from "../lib/style-dna";
import type { BehaviorStats, DimensionScores } from "../lib/types";

const prisma = new PrismaClient();

const TARGET_EMAIL = "admin@starringcapital.com";
const MOCK_COUNT = 20;
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toHsl(color?: { h: number; s: number; l: number }) {
  if (!color) return "hsl(0 0% 60%)";
  return `hsl(${Math.round(color.h)} ${Math.round(color.s)}% ${Math.round(color.l)}%)`;
}

function toScoreMap(rows: Array<{ dimension: Dimension; normalizedScore: number }>): DimensionScores {
  const map: DimensionScores = { EI: 0, SN: 0, TF: 0, JP: 0 };
  rows.forEach((row) => {
    map[row.dimension] = row.normalizedScore;
  });
  return map;
}

function buildPlannedScores(
  count: number,
  rng: seedrandom.PRNG,
  start?: DimensionScores,
): DimensionScores[] {
  const initial: DimensionScores =
    start ?? {
      EI: (rng() - 0.5) * 0.9,
      SN: (rng() - 0.5) * 0.9,
      TF: (rng() - 0.5) * 0.9,
      JP: (rng() - 0.5) * 0.9,
    };

  const output: DimensionScores[] = [];
  let current = { ...initial };

  for (let i = 0; i < count; i += 1) {
    const drift = i > count / 2 ? 0.02 : -0.01;
    current = {
      EI: clamp(current.EI + (rng() - 0.5) * 0.24 + Math.sin(i / 3.1) * 0.03 + drift * 0.2, -0.92, 0.92),
      SN: clamp(current.SN + (rng() - 0.5) * 0.22 - Math.cos(i / 3.8) * 0.02 + drift * 0.15, -0.92, 0.92),
      TF: clamp(current.TF + (rng() - 0.5) * 0.2 + Math.sin(i / 2.4) * 0.02 + drift * 0.18, -0.92, 0.92),
      JP: clamp(current.JP + (rng() - 0.5) * 0.26 + Math.cos(i / 4.2) * 0.03 + drift * 0.1, -0.92, 0.92),
    };
    output.push({ ...current });
  }

  return output;
}

function simulateAnswers(
  questions: ScoringQuestion[],
  targetScores: DimensionScores,
  rng: seedrandom.PRNG,
): ScoringAnswer[] {
  return questions.map((q) => {
    const sign = q.direction * (q.reverseScoring ? -1 : 1);
    const target = targetScores[q.dimension];
    const desiredBase = (target * 2) / (sign || 1);
    const noisy = desiredBase + (rng() - 0.5) * 1.2;
    const choice = clamp(Math.round(noisy + 3), 1, 5);
    return {
      questionId: q.id,
      choice,
    };
  });
}

async function main() {
  const rng = seedrandom(`mock:${TARGET_EMAIL}:v2`);

  let user = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } });
  if (!user) {
    const passwordHash = await bcrypt.hash("Admin123456", 10);
    user = await prisma.user.create({
      data: {
        email: TARGET_EMAIL,
        name: "Admin",
        passwordHash,
      },
    });
    console.log(`Created user ${TARGET_EMAIL} with password Admin123456`);
  }

  const existingCompleted = await prisma.testSession.findMany({
    where: { userId: user.id, status: "COMPLETED" },
    orderBy: { createdAt: "asc" },
    include: {
      dimensionScores: true,
    },
  });

  const existingQuestionRows = await prisma.question.findMany({
    where: {
      session: {
        userId: user.id,
        status: "COMPLETED",
      },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: { text: true },
  });

  let styleDNA = parseStyleDNA(user.styleDNA);

  const historyRecords: Array<{
    mbtiType: string | null;
    behaviorStats: unknown;
    dimensionScores: Array<{ dimension: string; normalizedScore: number }>;
  }> = existingCompleted.map((s) => ({
    mbtiType: s.mbtiType,
    behaviorStats: s.behaviorStats,
    dimensionScores: s.dimensionScores.map((d) => ({
      dimension: d.dimension,
      normalizedScore: d.normalizedScore,
    })),
  }));

  const historyPoints = existingCompleted.map((s) => ({
    createdAt: s.createdAt.toISOString(),
    scores: toScoreMap(
      s.dimensionScores.map((d) => ({
        dimension: d.dimension,
        normalizedScore: d.normalizedScore,
      })),
    ),
    mbti: s.mbtiType ?? undefined,
  }));

  const recentTexts = existingQuestionRows.map((q) => q.text);

  const lastToken = await prisma.avatarToken.findFirst({
    where: { userId: user.id },
    orderBy: { tokenIndex: "desc" },
    select: { tokenIndex: true },
  });
  let tokenIndex = (lastToken?.tokenIndex ?? 0) + 1;

  const latestScores = historyPoints.at(-1)?.scores;
  const plannedScores = buildPlannedScores(MOCK_COUNT, rng, latestScores);

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const startOffsetDays = MOCK_COUNT * 3;

  let inserted = 0;
  let persistedStyleDNA = Boolean(styleDNA);

  for (let i = 0; i < MOCK_COUNT; i += 1) {
    const sessionStart = new Date(now - (startOffsetDays - i * 3) * dayMs);
    const questionCount = 36;

    const currentPersona = buildPersonaModel(historyRecords);

    const generatedQuestions = generateQuestions(questionCount, `${TARGET_EMAIL}:session:${i}:${sessionStart.getTime()}`, {
      personaModel: currentPersona,
      historyCount: historyRecords.length,
      recentQuestionTexts: recentTexts,
      latestScores: historyPoints.at(-1)?.scores ?? null,
      latestBehavior: (historyRecords.at(-1)?.behaviorStats ?? null) as Partial<BehaviorStats> | null,
    });

    const scoringQuestions: ScoringQuestion[] = generatedQuestions.map((q) => ({
      id: q.id,
      dimension: q.dimension,
      direction: q.direction,
      reverseScoring: q.reverseScoring,
    }));

    const answers = simulateAnswers(scoringQuestions, plannedScores[i], rng);
    const scoreResult = scoreSession(scoringQuestions, answers);

    const completionSeconds = Math.round(360 + rng() * 780);
    const completedAt = new Date(sessionStart.getTime() + completionSeconds * 1000);
    const behaviorStats = calculateBehaviorStats(scoringQuestions, answers, completionSeconds);

    const created = await prisma.testSession.create({
      data: {
        userId: user.id,
        status: "COMPLETED",
        questionCount: generatedQuestions.length,
        mbtiType: scoreResult.mbti,
        startedAt: sessionStart,
        completedAt,
        completionSeconds,
        behaviorStats,
        createdAt: sessionStart,
        updatedAt: completedAt,
        questions: {
          create: generatedQuestions.map((q, index) => ({
            orderIndex: index,
            text: q.text,
            dimension: q.dimension,
            direction: q.direction,
            reverseScoring: q.reverseScoring,
            choices: q.choices,
            createdAt: sessionStart,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!styleDNA) {
      styleDNA = generateStyleDNA({
        userId: user.id,
        sessionId: created.id,
        scores: scoreResult.normalizedScores,
        behavior: behaviorStats,
      });
    }
    const dna = styleDNA;
    if (!dna) throw new Error("styleDNA generation failed");

    const personaWithCurrent = buildPersonaModel([
      ...historyRecords,
      {
        mbtiType: scoreResult.mbti,
        behaviorStats,
        dimensionScores: (["EI", "SN", "TF", "JP"] as const).map((dimension) => ({
          dimension,
          normalizedScore: scoreResult.normalizedScores[dimension],
        })),
      },
    ]);

    const petModel = generatePetModel({
      userId: user.id,
      sessionId: created.id,
      mbti: scoreResult.mbti,
      styleDNA: dna,
      scores: scoreResult.normalizedScores,
      behavior: behaviorStats,
    });

    const regions = {
      head: Math.max(0, Math.min(1, Math.abs(scoreResult.normalizedScores[dna.regionMap.head]))),
      chest: Math.max(0, Math.min(1, Math.abs(scoreResult.normalizedScores[dna.regionMap.chest]))),
      belly: Math.max(0, Math.min(1, Math.abs(scoreResult.normalizedScores[dna.regionMap.belly]))),
      armL: Math.max(0, Math.min(1, Math.abs(scoreResult.normalizedScores[dna.regionMap.armL]))),
      armR: Math.max(0, Math.min(1, Math.abs(scoreResult.normalizedScores[dna.regionMap.armR]))),
      legL: Math.max(0, Math.min(1, Math.abs(scoreResult.normalizedScores[dna.regionMap.legL]))),
      legR: Math.max(0, Math.min(1, Math.abs(scoreResult.normalizedScores[dna.regionMap.legR]))),
      aura: Math.max(0, Math.min(1, Math.abs(scoreResult.normalizedScores[dna.regionMap.aura]))),
    };

    const byDimension = {
      EI: dna.basePalette[0],
      SN: dna.basePalette[1],
      TF: dna.basePalette[2],
      JP: dna.basePalette[3],
    } as const;

    const regionColors = {
      head: toHsl(byDimension[dna.regionMap.head]),
      chest: toHsl(byDimension[dna.regionMap.chest]),
      belly: toHsl(byDimension[dna.regionMap.belly]),
      armL: toHsl(byDimension[dna.regionMap.armL]),
      armR: toHsl(byDimension[dna.regionMap.armR]),
      legL: toHsl(byDimension[dna.regionMap.legL]),
      legR: toHsl(byDimension[dna.regionMap.legR]),
      aura: toHsl(byDimension[dna.regionMap.aura]),
    };

    const trend = analyzePersonalityTrend([
      ...historyPoints,
      {
        createdAt: sessionStart.toISOString(),
        scores: scoreResult.normalizedScores,
        mbti: scoreResult.mbti,
      },
    ]);
    const advice = generateAdvice(trend);

    await prisma.$transaction(async (tx) => {
      await tx.answer.createMany({
        data: created.questions.map((question, idx) => {
          const a = answers[idx];
          return {
            sessionId: created.id,
            questionId: question.id,
            userId: user.id,
            choice: a.choice,
            mappedValue: scoreResult.answerMappedValues[generatedQuestions[idx].id] ?? 0,
            elapsedMs: Math.round(3500 + rng() * 14500),
            createdAt: new Date(sessionStart.getTime() + (idx + 1) * 1000),
          };
        }),
      });

      await tx.dimensionScore.createMany({
        data: (["EI", "SN", "TF", "JP"] as const).map((dimension) => ({
          sessionId: created.id,
          dimension,
          rawScore: scoreResult.rawScores[dimension],
          normalizedScore: scoreResult.normalizedScores[dimension],
          letter: scoreResult.letters[dimension],
          createdAt: completedAt,
        })),
      });

      await tx.avatarToken.create({
        data: {
          sessionId: created.id,
          userId: user.id,
          tokenIndex,
          seed: petModel.seed,
          regions,
          regionColors,
          textureOverlay: dna.texture,
          derivedStats: {
            mbti: scoreResult.mbti,
            contrast: Math.round(behaviorStats.extremity * (1 - behaviorStats.neutrality) * 10000) / 10000,
            harmony:
              Math.round(
                Math.max(
                  0,
                  Math.min(1, behaviorStats.consistency * (1 - behaviorStats.reverseSensitivity * 0.45)),
                ) * 10000,
              ) / 10000,
            volatility:
              Math.round(
                Math.max(0, Math.min(1, (1 - behaviorStats.consistency) * 0.6 + behaviorStats.reverseSensitivity * 0.8)) *
                  10000,
              ) / 10000,
            archetype: personaWithCurrent.archetype,
            traits: [petModel.species, petModel.mood, petModel.eyeStyle, petModel.accessory, petModel.featureTag],
            personaModel: personaWithCurrent,
            petModel,
          },
          svg: PET_PLACEHOLDER_SVG,
          generatedAt: completedAt,
        },
      });

      await tx.mentorAdvice.create({
        data: {
          sessionId: created.id,
          userId: user.id,
          insights: trend.insights,
          actionSuggestions: advice.actionSuggestions,
          reflectionQuestion: advice.reflectionQuestion,
          microPlan: advice.microPlan,
          generatedAt: completedAt,
        },
      });

      if (!persistedStyleDNA && styleDNA) {
        await tx.user.update({
          where: { id: user.id },
          data: { styleDNA },
        });
        persistedStyleDNA = true;
      }
    });

    tokenIndex += 1;
    inserted += 1;

    historyRecords.push({
      mbtiType: scoreResult.mbti,
      behaviorStats,
      dimensionScores: (["EI", "SN", "TF", "JP"] as const).map((dimension) => ({
        dimension,
        normalizedScore: scoreResult.normalizedScores[dimension],
      })),
    });

    historyPoints.push({
      createdAt: sessionStart.toISOString(),
      scores: scoreResult.normalizedScores,
      mbti: scoreResult.mbti,
    });

    generatedQuestions.forEach((q) => recentTexts.push(q.text));

    console.log(`Inserted session ${i + 1}/${MOCK_COUNT}: ${scoreResult.mbti} at ${sessionStart.toISOString()}`);
  }

  const finalCount = await prisma.testSession.count({
    where: { userId: user.id, status: "COMPLETED" },
  });

  console.log("Done.");
  console.log(`User: ${TARGET_EMAIL}`);
  console.log(`Inserted sessions: ${inserted}`);
  console.log(`Total completed sessions now: ${finalCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
