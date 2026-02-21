import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { buildBasicPersonaAnalysis, type DemographicGender } from "@/lib/demographic-analysis";
import { prisma } from "@/lib/prisma";
import type { DimensionScores } from "@/lib/types";

type Params = {
  params: Promise<{ id: string }>;
};

const payloadSchema = z.object({
  age: z.number().int().min(8).max(90),
  gender: z.enum(["male", "female", "nonbinary", "private"]),
});

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "参数不合法" }, { status: 400 });
    }

    const { id } = await params;
    const testSession = await prisma.testSession.findFirst({
      where: {
        id,
        userId: session.user.id,
        status: "COMPLETED",
      },
      include: {
        dimensionScores: true,
      },
    });

    if (!testSession) {
      return NextResponse.json({ error: "测试记录不存在" }, { status: 404 });
    }

    const scores: DimensionScores = { EI: 0, SN: 0, TF: 0, JP: 0 };
    for (const row of testSession.dimensionScores) {
      scores[row.dimension] = row.normalizedScore;
    }

    const analysis = buildBasicPersonaAnalysis({
      mbtiType: testSession.mbtiType ?? "UNKN",
      scores,
      profile: {
        age: parsed.data.age,
        gender: parsed.data.gender as DemographicGender,
      },
    });

    const previous =
      testSession.behaviorStats && typeof testSession.behaviorStats === "object"
        ? (testSession.behaviorStats as Record<string, unknown>)
        : {};

    await prisma.testSession.update({
      where: { id: testSession.id },
      data: {
        behaviorStats: {
          ...previous,
          demographicProfile: {
            age: parsed.data.age,
            gender: parsed.data.gender,
          },
          demographicAnalysis: analysis,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      analysis,
    });
  } catch (error) {
    console.error("save demographics failed:", error);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
