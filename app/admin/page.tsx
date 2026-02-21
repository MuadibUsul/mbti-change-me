import { subDays } from "date-fns";
import { Card } from "@/components/Card";
import { prisma } from "@/lib/prisma";

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function ratio(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return numerator / denominator;
}

export default async function AdminOverviewPage() {
  const now = new Date();
  const dayAgo = subDays(now, 1);
  const weekAgo = subDays(now, 7);
  const twoWeeksAgo = subDays(now, 14);

  const [
    usersTotal,
    newUsers7d,
    completedTests,
    completedTests7d,
    avatarTotal,
    adviceTotal,
    views24h,
    views7d,
    viewsPrev7d,
    uniqueVisitors7dRows,
    topPaths,
    activeUsers7dRows,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        createdAt: { gte: weekAgo },
      },
    }),
    prisma.testSession.count({
      where: { status: "COMPLETED" },
    }),
    prisma.testSession.count({
      where: {
        status: "COMPLETED",
        createdAt: { gte: weekAgo },
      },
    }),
    prisma.avatarToken.count(),
    prisma.mentorAdvice.count(),
    prisma.trafficEvent.count({
      where: { createdAt: { gte: dayAgo } },
    }),
    prisma.trafficEvent.count({
      where: { createdAt: { gte: weekAgo } },
    }),
    prisma.trafficEvent.count({
      where: {
        createdAt: {
          gte: twoWeeksAgo,
          lt: weekAgo,
        },
      },
    }),
    prisma.trafficEvent.findMany({
      where: {
        createdAt: { gte: weekAgo },
        sessionKey: { not: null },
      },
      distinct: ["sessionKey"],
      select: { sessionKey: true },
    }),
    prisma.trafficEvent.groupBy({
      by: ["path"],
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 8,
    }),
    prisma.testSession.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: weekAgo },
      },
      distinct: ["userId"],
      select: { userId: true },
    }),
  ]);

  const uniqueVisitors7d = uniqueVisitors7dRows.length;
  const activeUsers7d = activeUsers7dRows.length;
  const visitorToUserRate = ratio(activeUsers7d, uniqueVisitors7d);
  const completionPerUser = ratio(completedTests, usersTotal);
  const viewsTrend = viewsPrev7d ? (views7d - viewsPrev7d) / viewsPrev7d : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-surface)]/62">24h 流量</p>
          <p className="mt-2 text-3xl font-semibold text-[var(--color-surface)]">{views24h}</p>
          <p className="mt-1 text-xs text-[var(--color-surface)]/66">7天总访问 {views7d}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-surface)]/62">访客与转化</p>
          <p className="mt-2 text-3xl font-semibold text-[var(--color-surface)]">{uniqueVisitors7d}</p>
          <p className="mt-1 text-xs text-[var(--color-surface)]/66">活跃用户转化率 {pct(visitorToUserRate)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-surface)]/62">用户规模</p>
          <p className="mt-2 text-3xl font-semibold text-[var(--color-surface)]">{usersTotal}</p>
          <p className="mt-1 text-xs text-[var(--color-surface)]/66">7天新增 {newUsers7d}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-surface)]/62">业务产出</p>
          <p className="mt-2 text-3xl font-semibold text-[var(--color-surface)]">{completedTests}</p>
          <p className="mt-1 text-xs text-[var(--color-surface)]/66">
            人均完成 {completionPerUser.toFixed(2)} 次 · 7天新增 {completedTests7d}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[var(--color-surface)]">全站健康度</h2>
          <div className="mt-4 grid gap-2 text-sm text-[var(--color-surface)]/82">
            <p>访问趋势（近7天 vs 前7天）：{viewsPrev7d ? pct(viewsTrend) : "样本不足"}</p>
            <p>AI 形象总产出：{avatarTotal}</p>
            <p>建议系统生成次数：{adviceTotal}</p>
            <p>近7天有完成测验的用户：{activeUsers7d}</p>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[var(--color-surface)]">热门页面</h2>
          <div className="mt-4 space-y-2">
            {topPaths.length ? (
              topPaths.map((item) => (
                <div key={item.path} className="flex items-center justify-between rounded border border-white/12 bg-white/6 px-3 py-2 text-sm">
                  <span className="truncate pr-3 text-[var(--color-surface)]/86">{item.path}</span>
                  <span className="shrink-0 text-[var(--color-surface)]/66">{item._count.path}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--color-surface)]/74">暂无访问数据。</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
