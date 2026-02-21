import { TimelineDashboard } from "@/components/timeline-dashboard";
import { requireSession } from "@/lib/require-session";

export default async function TimelineAllPage() {
  await requireSession();

  return (
    <div className="space-y-4 pt-2">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-surface)]/58">人格轨迹</p>
      <h1 className="hero-title text-2xl md:text-3xl">人格变化全量长廊</h1>
      <p className="text-sm text-[var(--color-surface)]/72">
        在这里查看全部历史 Persona Token，并通过时间、类型、特征进行精细筛选。
      </p>
      <TimelineDashboard mode="all" initialRange="all" />
    </div>
  );
}
