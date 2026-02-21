"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useVisualSystem } from "@/components/visual-system-provider";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/test/new";
  const { profile } = useVisualSystem();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);
    if (!result || result.error) {
      setError("邮箱或密码错误");
      return;
    }

    router.push(result.url ?? callbackUrl);
  };

  return (
    <Card className="mx-auto w-full max-w-md p-6 md:p-7">
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 22, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.65 / profile.motionSystem.speed }}
        className="space-y-4"
      >
        <h1 className="text-2xl font-semibold tracking-[var(--tracking-heading)] text-[var(--color-surface)]">登录</h1>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="请输入邮箱"
          className="w-full rounded-[var(--radius-md)] border border-white/20 bg-white/8 px-3 py-2.5 text-sm text-[var(--color-surface)] outline-none transition placeholder:text-[var(--color-surface)]/44 focus:border-[var(--color-glow)]"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="请输入密码（至少6位）"
          className="w-full rounded-[var(--radius-md)] border border-white/20 bg-white/8 px-3 py-2.5 text-sm text-[var(--color-surface)] outline-none transition placeholder:text-[var(--color-surface)]/44 focus:border-[var(--color-glow)]"
        />
        {error ? <p className="rounded-[var(--radius-sm)] border border-rose-300/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</p> : null}
        <Button type="submit" magnetic disabled={loading} className="w-full py-2.5">
          {loading ? "登录中..." : "进入我的人格宇宙"}
        </Button>
        <Link href="/test/new" className="block text-center text-xs text-[var(--color-surface)]/64 underline underline-offset-2">
          游客体验一次（不保存历史）
        </Link>
      </motion.form>
    </Card>
  );
}
