"use client";

import { Card } from "@/components/Card";
import type { MbtiDashboardProfile } from "@/lib/mbti-dashboard";

type GrowthPathCardProps = {
  profile: MbtiDashboardProfile;
};

export function GrowthPathCard({ profile }: GrowthPathCardProps) {
  return (
    <Card className="p-5" hoverable={false}>
      <h3 className="text-lg font-semibold text-[var(--color-surface)]">人格成长路径</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-[var(--radius-sm)] border border-white/14 bg-white/8 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-surface)]/62">推荐职业方向</p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--color-surface)]/86">
            {profile.growthPath.careers.map((career) => (
              <li key={career}>• {career}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <div className="rounded-[var(--radius-sm)] border border-white/14 bg-white/8 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-surface)]/62">适合的学习方式</p>
            <p className="mt-2 text-sm text-[var(--color-surface)]/84">{profile.growthPath.learningStyle}</p>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-white/14 bg-white/8 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-surface)]/62">人际建议</p>
            <p className="mt-2 text-sm text-[var(--color-surface)]/84">{profile.growthPath.relationshipAdvice}</p>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-white/14 bg-white/8 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-surface)]/62">成长建议</p>
            <p className="mt-2 text-sm text-[var(--color-surface)]/84">{profile.growthPath.growthAdvice}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
