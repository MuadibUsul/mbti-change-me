import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getOrCreateAvatar, regenerateVariant } from "@/lib/avatar-line";
import { createPrismaAvatarStorageAdapter, parseLineAvatarConfig } from "@/lib/avatar-line/storage-prisma";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

const bodySchema = z.object({
  action: z.enum(["get", "variant"]).default("get"),
});

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
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
        answers: {
          select: {
            questionId: true,
            choice: true,
          },
        },
        avatarToken: {
          select: {
            derivedStats: true,
          },
        },
      },
    });

    if (!testSession) {
      return NextResponse.json({ error: "测试记录不存在" }, { status: 404 });
    }

    const mbti = testSession.mbtiType ?? "UNKN";
    const answerInputs = testSession.answers.map((item) => ({
      questionId: item.questionId,
      option: String(item.choice),
    }));

    const storage = createPrismaAvatarStorageAdapter({
      userId: session.user.id,
      sessionId: testSession.id,
    });
    const existingConfig = parseLineAvatarConfig(testSession.avatarToken?.derivedStats);

    const record =
      parsed.data.action === "variant"
        ? await regenerateVariant(
            existingConfig ??
              (
                await getOrCreateAvatar({
                  userId: session.user.id,
                  mbti,
                  answers: answerInputs,
                  storage,
                  sessionId: testSession.id,
                })
              ).config,
            storage,
            testSession.id,
          )
        : await getOrCreateAvatar({
            userId: session.user.id,
            mbti,
            answers: answerInputs,
            storage,
            sessionId: testSession.id,
            existingConfig,
          });

    return NextResponse.json({
      ok: true,
      avatar: {
        config: record.config,
        svg: record.svg,
      },
    });
  } catch (error) {
    console.error("avatar line generate failed:", error);
    return NextResponse.json({ error: "生成头像失败" }, { status: 500 });
  }
}
