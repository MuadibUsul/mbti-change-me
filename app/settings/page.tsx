import { signOut } from "@/auth";
import { Card } from "@/components/Card";
import { StyleGenomeMap } from "@/components/StyleGenomeMap";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { parseStyleDNA } from "@/lib/style-dna";

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export default async function SettingsPage() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: {
          testSessions: true,
          avatarTokens: true,
        },
      },
      testSessions: {
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          dimensionScores: true,
        },
      },
    },
  });

  const styleDNA = parseStyleDNA(user?.styleDNA);
  const latest = user?.testSessions?.[0];
  const recent = user?.testSessions ?? [];
  const latestScores = {
    EI: latest?.dimensionScores.find((item) => item.dimension === "EI")?.normalizedScore ?? 0,
    SN: latest?.dimensionScores.find((item) => item.dimension === "SN")?.normalizedScore ?? 0,
    TF: latest?.dimensionScores.find((item) => item.dimension === "TF")?.normalizedScore ?? 0,
    JP: latest?.dimensionScores.find((item) => item.dimension === "JP")?.normalizedScore ?? 0,
  };

  const volatility = avg(
    ["EI", "SN", "TF", "JP"].map((dimension) => {
      const values = recent.map((s) => s.dimensionScores.find((d) => d.dimension === dimension)?.normalizedScore ?? 0);
      if (values.length < 2) return 0;
      const mean = avg(values);
      const variance = avg(values.map((v) => (v - mean) ** 2));
      return Math.sqrt(variance);
    }),
  );
  const toneMap: Record<string, string> = {
    calm: "沉静",
    warm: "温暖",
    analytic: "理性",
    playful: "灵动",
  };

  return (
    <div className="space-y-5 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="hero-title text-2xl md:text-3xl">账户与人格设置中心</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-[var(--radius-sm)] border border-white/24 px-4 py-2 text-sm font-semibold text-[var(--color-surface)]/88 transition hover:bg-white/12"
          >
            退出登录
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-surface)]/58">账户信息</p>
          <p className="mt-3 text-sm text-[var(--color-surface)]/86">邮箱：{user?.email}</p>
          <p className="mt-2 text-sm text-[var(--color-surface)]/78">已完成测验：{user?._count.testSessions ?? 0}</p>
          <p className="mt-2 text-sm text-[var(--color-surface)]/78">已生成 Token：{user?._count.avatarTokens ?? 0}</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-surface)]/58">近期人格状态</p>
          <p className="mt-3 text-sm text-[var(--color-surface)]/86">最新 MBTI：{latest?.mbtiType ?? "暂无"}</p>
          <p className="mt-2 text-sm text-[var(--color-surface)]/78">近期波动度：{volatility.toFixed(3)}</p>
          <p className="mt-2 text-sm text-[var(--color-surface)]/78">
            最近测验时间：{latest ? new Date(latest.createdAt).toLocaleString() : "暂无"}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-surface)]/58">AI 伙伴状态</p>
          {styleDNA?.companion ? (
            <>
              <p className="mt-3 text-sm text-[var(--color-surface)]/86">名称：{styleDNA.companion.name}</p>
              <p className="mt-2 text-sm text-[var(--color-surface)]/78">角色：{styleDNA.companion.role}</p>
              <p className="mt-2 text-sm text-[var(--color-surface)]/78">
                语气：{toneMap[styleDNA.companion.tone] ?? styleDNA.companion.tone}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-[var(--color-surface)]/78">完成首次测验后将生成专属 AI 伙伴。</p>
          )}
        </Card>
      </div>

      <StyleGenomeMap styleDNA={styleDNA} latestScores={latestScores} />
    </div>
  );
}
