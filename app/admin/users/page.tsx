import { revalidatePath } from "next/cache";
import { Card } from "@/components/Card";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

async function removeUserAction(formData: FormData) {
  "use server";
  const session = await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  if (id === session.user.id) return;

  await prisma.user.delete({
    where: { id },
  });
  revalidatePath("/admin/users");
}

export default async function AdminUsersPage() {
  await requireAdminSession();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 120,
    include: {
      _count: {
        select: {
          testSessions: true,
          avatarTokens: true,
        },
      },
      testSessions: {
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, mbtiType: true },
      },
    },
  });

  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-[var(--color-surface)]">用户管理</h2>
      <p className="mt-1 text-sm text-[var(--color-surface)]/72">展示最近 120 位用户，可查看核心行为并执行删除。</p>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/16 text-[var(--color-surface)]/68">
              <th className="px-3 py-2">邮箱</th>
              <th className="px-3 py-2">注册时间</th>
              <th className="px-3 py-2">完成测验</th>
              <th className="px-3 py-2">Token</th>
              <th className="px-3 py-2">最新MBTI</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-white/8 text-[var(--color-surface)]/86">
                <td className="px-3 py-2">{user.email}</td>
                <td className="px-3 py-2">{new Date(user.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2">{user._count.testSessions}</td>
                <td className="px-3 py-2">{user._count.avatarTokens}</td>
                <td className="px-3 py-2">{user.testSessions[0]?.mbtiType ?? "-"}</td>
                <td className="px-3 py-2">
                  <form action={removeUserAction}>
                    <input type="hidden" name="id" value={user.id} />
                    <button
                      type="submit"
                      className="rounded border border-rose-300/45 px-2 py-1 text-xs text-rose-200 transition hover:bg-rose-500/12"
                    >
                      删除
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
