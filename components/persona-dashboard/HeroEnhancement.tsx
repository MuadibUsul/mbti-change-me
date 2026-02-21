"use client";

import { RadarChartSvg } from "@/components/persona-dashboard/RadarChartSvg";
import type { MbtiDashboardProfile } from "@/lib/mbti-dashboard";

type HeroEnhancementProps = {
  profile: MbtiDashboardProfile;
  onCreateAvatar?: () => void;
};

export function HeroEnhancement({ profile, onCreateAvatar }: HeroEnhancementProps) {
  return (
    <div className="space-y-4 rounded-[var(--radius-md)] border border-white/18 bg-white/10 p-4 md:p-5">
      <p className="text-sm leading-relaxed text-[var(--color-surface)]/90">{profile.oneLiner}</p>

      <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="h-44 w-full rounded-[var(--radius-sm)] border border-white/14 bg-black/24 p-2">
          <RadarChartSvg axes={["E", "N", "F", "J"]} values={profile.radarE_N_F_J} size={190} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-surface)]/62">核心优势</p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--color-surface)]/86">
              {profile.coreAdvantages.slice(0, 3).map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-surface)]/62">潜在挑战</p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--color-surface)]/82">
              {profile.challenges.slice(0, 2).map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {profile.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-white/24 bg-white/12 px-3 py-1 text-xs text-[var(--color-surface)]/86">
            {tag}
          </span>
        ))}
      </div>

      {onCreateAvatar ? (
        <button
          type="button"
          onClick={onCreateAvatar}
          className="rounded-[var(--radius-sm)] border border-white/24 bg-white/12 px-4 py-2 text-sm font-semibold text-[var(--color-surface)] transition hover:bg-white/18"
        >
          跳转到形象区域
        </button>
      ) : null}
    </div>
  );
}
