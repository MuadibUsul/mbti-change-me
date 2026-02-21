import { TimelineDashboard } from "@/components/timeline-dashboard";
import { requireSession } from "@/lib/require-session";

export default async function TimelinePage() {
  await requireSession();

  return (
    <div className="space-y-4 pt-2">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-surface)]/58">人格轨迹</p>
      <h1 className="hero-title text-2xl md:text-3xl">人格变化时间轴</h1>
      <p className="text-sm text-[var(--color-surface)]/72">
        默认展示最新 6 次测试形象，可按时间、类型、特征筛选；需要完整历史时可进入全量页面查看。
      </p>
      <TimelineDashboard mode="latest" initialRange="90d" />
    </div>
  );
}
