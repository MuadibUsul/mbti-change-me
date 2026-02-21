import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterForm } from "@/components/register-form";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/test/new");

  return (
    <div className="space-y-4 pt-8">
      <RegisterForm />
      <p className="text-center text-sm text-[var(--color-surface)]/70">
        已有账号？{" "}
        <Link href="/auth/login" className="font-semibold text-[var(--color-glow)]">
          去登录
        </Link>
      </p>
    </div>
  );
}
