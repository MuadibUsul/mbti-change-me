"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card } from "@/components/Card";
import { ResultShowcase } from "@/components/ResultShowcase";
import { parseJung16Score } from "@/lib/jung16-style";
import { parsePetModel } from "@/lib/pet-model";

type GuestPayload = {
  guest: true;
  mbti: string;
  scores: { EI: number; SN: number; TF: number; JP: number };
  avatarToken?: {
    derivedStats?: {
      archetype?: string;
      traits?: string[];
      petModel?: unknown;
      jung16?: unknown;
    };
  };
  mentor?: {
    actionSuggestions?: string[];
    reflectionQuestion?: string;
    microPlan?: string[];
  };
};

export default function GuestResultPage() {
  const payload = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem("guest_test_result");
      if (!raw) return null;
      return JSON.parse(raw) as GuestPayload;
    } catch {
      return null;
    }
  }, []);

  const content = useMemo(() => {
    if (!payload) return null;
    return (
      <ResultShowcase
        mbtiType={payload.mbti}
        archetype={payload.avatarToken?.derivedStats?.archetype}
        traits={payload.avatarToken?.derivedStats?.traits ?? []}
        petModel={parsePetModel(payload.avatarToken?.derivedStats?.petModel)}
        scores={payload.scores}
        suggestions={payload.mentor?.actionSuggestions ?? []}
        reflectionQuestion={payload.mentor?.reflectionQuestion ?? "今天你最真实的感受是什么？"}
        microPlan={payload.mentor?.microPlan ?? []}
        jung16={parseJung16Score(payload.avatarToken?.derivedStats?.jung16)}
      />
    );
  }, [payload]);

  if (!content) {
    return (
      <Card className="mx-auto mt-10 max-w-xl p-6">
        <p className="text-sm text-[var(--color-surface)]/84">未找到游客结果，请先完成一次游客测验。</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/test/new" className="rounded-[var(--radius-sm)] border border-white/24 px-3 py-2 text-sm">
            去测验
          </Link>
          <Link href="/auth/login" className="rounded-[var(--radius-sm)] border border-white/24 px-3 py-2 text-sm">
            登录并保存结果
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pt-3">
      <Card className="border-amber-200/35 bg-amber-500/10 p-4">
        <p className="text-sm text-amber-100/95">
          当前为游客模式结果：本次结果不会写入时间轴与长期档案。登录后可持续记录并追踪变化。
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/auth/login" className="rounded-[var(--radius-sm)] border border-amber-200/45 px-3 py-1.5 text-sm text-amber-100">
            立即登录并继续
          </Link>
          <Link href="/auth/register" className="rounded-[var(--radius-sm)] border border-amber-200/45 px-3 py-1.5 text-sm text-amber-100">
            注册账号
          </Link>
        </div>
      </Card>
      {content}
    </div>
  );
}

