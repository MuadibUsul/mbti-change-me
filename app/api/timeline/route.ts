import { subDays } from "date-fns";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Dimension } from "@/lib/types";

const rangeMap: Record<string, number | null> = {
  "30d": 30,
  "90d": 90,
  "180d": 180,
  all: null,
};

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") ?? "90d";
    const days = rangeMap[range] ?? 90;
    const dateFilter = days ? subDays(new Date(), days) : null;

    const sessions = await prisma.testSession.findMany({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        ...(dateFilter
          ? {
              createdAt: {
                gte: dateFilter,
              },
            }
          : {}),
      },
      orderBy: { createdAt: "asc" },
      include: {
        dimensionScores: true,
        avatarToken: true,
      },
    });

    const chartData = sessions.map((item) => {
      const scores: Record<Dimension, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };
      item.dimensionScores.forEach((row) => {
        scores[row.dimension as Dimension] = row.normalizedScore;
      });
      return {
        id: item.id,
        date: item.createdAt.toISOString().slice(0, 10),
        mbti: item.mbtiType,
        ...scores,
      };
    });

    const tokens = sessions
      .filter((s) => s.avatarToken)
      .map((s) => ({
        id: s.avatarToken!.id,
        sessionId: s.id,
        tokenIndex: s.avatarToken!.tokenIndex,
        mbti: s.mbtiType,
        generatedAt: s.avatarToken!.generatedAt,
        derivedStats: s.avatarToken!.derivedStats,
      }));

    return NextResponse.json({
      range,
      total: sessions.length,
      chartData,
      tokens,
    });
  } catch (error) {
    console.error("timeline failed:", error);
    return NextResponse.json({ error: "获取时间轴失败" }, { status: 500 });
  }
}

