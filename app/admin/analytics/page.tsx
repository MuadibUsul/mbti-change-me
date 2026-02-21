import { eachDayOfInterval, format, subDays } from "date-fns";
import { Card } from "@/components/Card";
import { prisma } from "@/lib/prisma";

type DayStat = {
  day: string;
  visits: number;
  tests: number;
  users: number;
};

function mapByDay(rows: { createdAt: Date }[]) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = format(row.createdAt, "yyyy-MM-dd");
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

export default async function AdminAnalyticsPage() {
  const end = new Date();
  const start = subDays(end, 13);

  const [visits, tests, users] = await Promise.all([
    prisma.trafficEvent.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
    }),
    prisma.testSession.findMany({
      where: { status: "COMPLETED", createdAt: { gte: start } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
    }),
  ]);

  const visitMap = mapByDay(visits);
  const testMap = mapByDay(tests);
  const userMap = mapByDay(users);
  const days = eachDayOfInterval({ start, end }).map((day): DayStat => {
    const key = format(day, "yyyy-MM-dd");
    return {
      day: key,
      visits: visitMap.get(key) ?? 0,
      tests: testMap.get(key) ?? 0,
      users: userMap.get(key) ?? 0,
    };
  });
  const maxVisit = Math.max(1, ...days.map((d) => d.visits));
  const maxTests = Math.max(1, ...days.map((d) => d.tests));
  const maxUsers = Math.max(1, ...days.map((d) => d.users));

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-[var(--color-surface)]">近14天全站数据分析</h2>
        <p className="mt-1 text-sm text-[var(--color-surface)]/74">覆盖流量、测验完成量、新增用户三条核心指标。</p>
      </Card>

      <Card className="p-5">
        <div className="space-y-3">
          {days.map((item) => (
            <div key={item.day} className="rounded-[var(--radius-sm)] border border-white/12 bg-white/6 p-3">
              <p className="mb-2 text-xs text-[var(--color-surface)]/72">{item.day}</p>
              <div className="space-y-2">
                <div>
                  <div className="mb-1 flex justify-between text-xs text-[var(--color-surface)]/75">
                    <span>访问量</span>
                    <span>{item.visits}</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/24">
                    <div className="h-2 rounded-full bg-[var(--color-primary)]" style={{ width: `${(item.visits / maxVisit) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-[var(--color-surface)]/75">
                    <span>完成测验</span>
                    <span>{item.tests}</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/24">
                    <div className="h-2 rounded-full bg-[var(--color-secondary)]" style={{ width: `${(item.tests / maxTests) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-[var(--color-surface)]/75">
                    <span>新增用户</span>
                    <span>{item.users}</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/24">
                    <div className="h-2 rounded-full bg-[var(--color-accent)]" style={{ width: `${(item.users / maxUsers) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
