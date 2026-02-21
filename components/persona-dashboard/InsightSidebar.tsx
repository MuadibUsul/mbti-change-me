"use client";

import { useState } from "react";
import { Card } from "@/components/Card";

type SidebarSection = {
  id: string;
  title: string;
};

type InsightSidebarProps = {
  sections: SidebarSection[];
  mbtiType: string | null;
};

export function InsightSidebar({ sections, mbtiType }: InsightSidebarProps) {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    const text = `${mbtiType ?? "MBTI"} 人格结果`;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: text, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // noop
    }
  };

  const onCompare = () => {
    document.getElementById("compare-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Card className="p-4" hoverable={false}>
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-surface)]/62">本页目录</p>
      <div className="mt-3 space-y-2">
        {sections.map((item, idx) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="block rounded-[var(--radius-sm)] border border-white/14 bg-white/6 px-3 py-2 text-sm text-[var(--color-surface)]/84 transition hover:bg-white/12"
          >
            {idx + 1}. {item.title}
          </a>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={onShare}
          className="w-full rounded-[var(--radius-sm)] border border-white/18 bg-white/10 px-3 py-2 text-sm text-[var(--color-surface)] transition hover:bg-white/16"
        >
          {copied ? "链接已复制" : "分享你的结果"}
        </button>
        <button
          type="button"
          onClick={onCompare}
          className="w-full rounded-[var(--radius-sm)] border border-white/18 bg-white/10 px-3 py-2 text-sm text-[var(--color-surface)] transition hover:bg-white/16"
        >
          与好友比较
        </button>
      </div>
    </Card>
  );
}
