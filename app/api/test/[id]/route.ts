import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseStyleDNA } from "@/lib/style-dna";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await params;
    const testSession = await prisma.testSession.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            styleDNA: true,
          },
        },
        questions: {
          orderBy: { orderIndex: "asc" },
        },
        answers: true,
        dimensionScores: true,
        avatarToken: true,
        mentorAdvice: true,
      },
    });

    if (!testSession || testSession.userId !== session.user.id) {
      return NextResponse.json({ error: "测验不存在" }, { status: 404 });
    }

    return NextResponse.json({
      id: testSession.id,
      status: testSession.status,
      mbtiType: testSession.mbtiType,
      startedAt: testSession.startedAt,
      completedAt: testSession.completedAt,
      behaviorStats: testSession.behaviorStats,
      questions: testSession.questions,
      answers: testSession.answers,
      dimensionScores: testSession.dimensionScores,
      avatarToken: testSession.avatarToken,
      mentorAdvice: testSession.mentorAdvice,
      styleDNA: parseStyleDNA(testSession.user.styleDNA),
    });
  } catch (error) {
    console.error("get test result failed:", error);
    return NextResponse.json({ error: "获取测验结果失败" }, { status: 500 });
  }
}

