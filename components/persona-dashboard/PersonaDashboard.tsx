"use client";

import { Card } from "@/components/Card";
import { ComparisonCard } from "@/components/persona-dashboard/ComparisonCard";
import { DimensionAnalysisCard } from "@/components/persona-dashboard/DimensionAnalysisCard";
import { GrowthPathCard } from "@/components/persona-dashboard/GrowthPathCard";
import { InsightSidebar } from "@/components/persona-dashboard/InsightSidebar";
import type { MbtiDashboardProfile } from "@/lib/mbti-dashboard";
import type { DimensionScores } from "@/lib/types";

type PersonaDashboardProps = {
  testId?: string;
  mbtiType: string | null;
  profile: MbtiDashboardProfile;
  scores: Partial<DimensionScores>;
};

const SIDEBAR_SECTIONS = [
  { id: "persona-text-section", title: "人格特征解读" },
  { id: "analysis-section", title: "测试数据分析" },
  { id: "growth-section", title: "人格成长路径" },
  { id: "compare-section", title: "人格对比" },
];

export function PersonaDashboard({ testId: _testId, mbtiType, profile, scores }: PersonaDashboardProps) {
  void _testId;
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <div className="space-y-5">
        <section id="persona-text-section">
          <Card className="p-5" hoverable={false}>
            <h3 className="text-lg font-semibold text-[var(--color-surface)]">人格特征</h3>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--color-surface)]/86">
              {profile.longText.map((paragraph, idx) => (
                <p key={`${idx}-${paragraph.slice(0, 12)}`}>{paragraph}</p>
              ))}
            </div>
          </Card>
        </section>

        <section id="analysis-section">
          <DimensionAnalysisCard pairs={profile.pairBreakdown} />
        </section>

        <section id="growth-section">
          <GrowthPathCard profile={profile} />
        </section>

        <section id="compare-section">
          <ComparisonCard currentMbti={mbtiType ?? "UNKN"} currentScores={scores} />
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <InsightSidebar sections={SIDEBAR_SECTIONS} mbtiType={mbtiType} />
      </aside>
    </div>
  );
}
