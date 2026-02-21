import Link from "next/link";
import { auth } from "@/auth";
import { TestRunner } from "@/components/test-runner";

export default async function NewTestPage() {
  const session = await auth();
  const guestMode = !session?.user?.id;

  return (
    <div className="space-y-5 pt-2">
      <section className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-surface)]/58">Adaptive Deep Session</p>
        <h1 className="hero-title text-2xl md:text-3xl">开始新一轮人格深测</h1>
        {guestMode ? (
          <p className="text-sm text-amber-100/90">
            当前为游客模式：可体验一次测验，但结果不会保存到时间轴。{" "}
            <Link href="/auth/login" className="underline underline-offset-2">
              登录后可长期记录
            </Link>
            。
          </p>
        ) : (
          <p className="text-sm text-[var(--color-surface)]/72">
            系统将基于你的历史人格轨迹，自动聚焦模糊维度与冲突维度，进行更深入的心理画像构建。
          </p>
        )}
      </section>
      <TestRunner count={36} guestMode={guestMode} />
    </div>
  );
}

