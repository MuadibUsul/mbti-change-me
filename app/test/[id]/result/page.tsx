import { notFound } from "next/navigation";
import { ResultShowcase } from "@/components/ResultShowcase";
import { parseJung16Score } from "@/lib/jung16-style";
import { parsePetModel } from "@/lib/pet-model";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { parseStyleDNA } from "@/lib/style-dna";

type Params = {
  params: Promise<{ id: string }>;
};

export default async function TestResultPage({ params }: Params) {
  const session = await requireSession();
  const { id } = await params;

  const result = await prisma.testSession.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      user: {
        select: {
          styleDNA: true,
        },
      },
      dimensionScores: true,
      avatarToken: true,
      mentorAdvice: true,
    },
  });

  if (!result) notFound();

  const scoreMap = { EI: 0, SN: 0, TF: 0, JP: 0 };
  result.dimensionScores.forEach((item) => {
    scoreMap[item.dimension as keyof typeof scoreMap] = item.normalizedScore;
  });

  const suggestions = (result.mentorAdvice?.actionSuggestions as string[] | null) ?? [];
  const microPlan = (result.mentorAdvice?.microPlan as string[] | null) ?? [];
  const derived =
    (result.avatarToken?.derivedStats as {
      archetype?: string;
      traits?: string[];
      petModel?: unknown;
      jung16?: unknown;
    } | null) ?? null;

  const styleDNA = parseStyleDNA(result.user.styleDNA);

  return (
    <div className="pt-3">
      <ResultShowcase
        testId={result.id}
        mbtiType={result.mbtiType}
        tokenIndex={result.avatarToken?.tokenIndex}
        archetype={derived?.archetype}
        traits={derived?.traits ?? []}
        petModel={parsePetModel(derived?.petModel)}
        scores={scoreMap}
        suggestions={suggestions}
        reflectionQuestion={result.mentorAdvice?.reflectionQuestion ?? "暂无反思问题"}
        microPlan={microPlan}
        companion={
          styleDNA?.companion
            ? {
                name: styleDNA.companion.name,
                role: styleDNA.companion.role,
                motto: styleDNA.companion.motto,
                tone: styleDNA.companion.tone,
              }
            : undefined
        }
        jung16={parseJung16Score(derived?.jung16)}
      />
    </div>
  );
}
