import Link from "next/link";
import { Card } from "@/components/Card";
import { requireAdminSession } from "@/lib/admin-auth";

const adminNav = [
  { href: "/admin", label: "总览" },
  { href: "/admin/analytics", label: "数据分析" },
  { href: "/admin/users", label: "用户管理" },
  { href: "/admin/payments", label: "收款绑定" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-surface)]/58">Admin Console</p>
            <h1 className="mt-1 text-xl font-semibold text-[var(--color-surface)]">后台管理系统</h1>
            <p className="mt-1 text-xs text-[var(--color-surface)]/72">当前管理员：{session.user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[var(--radius-sm)] border border-white/18 bg-white/8 px-3 py-1.5 text-sm text-[var(--color-surface)]/88 transition hover:bg-white/14"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </Card>
      {children}
    </div>
  );
}
