import { auth } from "@/auth";
import { AvatarPet3D } from "@/components/AvatarPet3D";
import { Card } from "@/components/Card";
import { RouteButton } from "@/components/RouteButton";
import { parsePetModel } from "@/lib/pet-model";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [latestToken, totalSessions] = await Promise.all([
    userId
      ? prisma.avatarToken.findFirst({
          where: { userId },
          orderBy: { tokenIndex: "desc" },
          select: {
            tokenIndex: true,
            derivedStats: true,
          },
        })
      : null,
    userId
      ? prisma.testSession.count({
          where: { userId, status: "COMPLETED" },
        })
      : 0,
  ]);

  const latestPetModel = parsePetModel(
    (latestToken?.derivedStats as {
      petModel?: unknown;
    } | null)?.petModel,
  );

  return (
    <div className="space-y-6 pt-4">
      <Card className="split-bg-radial p-6 md:p-8">
        <div className="grid items-center gap-8 md:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-surface)]/65">人格即视觉系统</p>
            <h1 className="hero-title text-3xl leading-tight md:text-5xl">每次答题，都会让你的 AI 人格小人持续进化。</h1>
            <p className="max-w-xl text-sm leading-relaxed text-[var(--color-surface)]/80 md:text-base">
              这是一个长期人格轨迹实验室：权威题库适配、历史记忆、自适应深挖、风格基因驱动、独一无二 AI 形象演化与可执行行动建议。
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <RouteButton href="/test/new" magnetic className="px-6 py-2.5">
                开始测试
              </RouteButton>
              <RouteButton href={session?.user ? "/timeline" : "/auth/login"} variant="outline" className="px-6 py-2.5">
                {session?.user ? "查看人格时间轴" : "登录"}
              </RouteButton>
            </div>
            {session?.user ? (
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-surface)]/60">已完成测验：{totalSessions}</p>
            ) : null}
          </div>

          <Card className="breath p-4 md:p-5">
            <div className="relative flex min-h-[300px] items-center justify-center">
              {latestToken ? (
                <>
                  <div className="absolute left-4 top-3 text-xs uppercase tracking-[0.14em] text-[var(--color-surface)]/66">
                    Persona Token #{latestToken.tokenIndex}
                  </div>
                  {latestPetModel ? (
                    <div className="h-64 w-64 rounded-[var(--radius-md)] border border-white/20 bg-black/20 p-2 md:h-72 md:w-72">
                      <AvatarPet3D petModel={latestPetModel} />
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--color-surface)]/75">当前 token 暂无形象数据，请完成一次新测验。</p>
                  )}
                </>
              ) : (
                <div className="space-y-3 text-center">
                  <div className="mx-auto h-20 w-20 rounded-full border border-white/30 bg-white/6" />
                  <p className="max-w-56 text-sm text-[var(--color-surface)]/75">首次完成测验后，这里会生成你的专属 AI 人格形象。</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
}
