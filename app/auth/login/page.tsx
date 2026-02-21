import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/test/new");

  return (
    <div className="space-y-4 pt-8">
      <LoginForm />
      <p className="text-center text-sm text-[var(--color-surface)]/70">
        还没有账号？{" "}
        <Link href="/auth/register" className="font-semibold text-[var(--color-glow)]">
          去注册
        </Link>
      </p>
    </div>
  );
}
