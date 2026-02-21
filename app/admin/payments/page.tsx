import { PaymentChannel } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Card } from "@/components/Card";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

const CHANNELS: PaymentChannel[] = ["WECHAT", "ALIPAY", "DOUYIN", "STRIPE", "PAYPAL", "BANK", "CUSTOM"];

async function createBindingAction(formData: FormData) {
  "use server";
  await requireAdminSession();

  const channel = String(formData.get("channel") ?? "") as PaymentChannel;
  const displayName = String(formData.get("displayName") ?? "").trim();
  const accountName = String(formData.get("accountName") ?? "").trim();
  const accountRef = String(formData.get("accountRef") ?? "").trim();
  const qrCodeUrl = String(formData.get("qrCodeUrl") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();

  if (!CHANNELS.includes(channel) || !displayName) return;

  await prisma.paymentBinding.create({
    data: {
      channel,
      displayName,
      accountName: accountName || null,
      accountRef: accountRef || null,
      qrCodeUrl: qrCodeUrl || null,
      instructions: instructions || null,
      enabled: true,
    },
  });

  revalidatePath("/admin/payments");
}

async function updateBindingAction(formData: FormData) {
  "use server";
  await requireAdminSession();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const displayName = String(formData.get("displayName") ?? "").trim();
  const accountName = String(formData.get("accountName") ?? "").trim();
  const accountRef = String(formData.get("accountRef") ?? "").trim();
  const qrCodeUrl = String(formData.get("qrCodeUrl") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();
  const enabled = String(formData.get("enabled") ?? "") === "on";

  await prisma.paymentBinding.update({
    where: { id },
    data: {
      displayName,
      accountName: accountName || null,
      accountRef: accountRef || null,
      qrCodeUrl: qrCodeUrl || null,
      instructions: instructions || null,
      enabled,
    },
  });

  revalidatePath("/admin/payments");
}

export default async function AdminPaymentsPage() {
  await requireAdminSession();

  const bindings = await prisma.paymentBinding.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-[var(--color-surface)]">收款方式绑定</h2>
        <p className="mt-1 text-sm text-[var(--color-surface)]/74">用于管理微信、支付宝、抖音、Stripe、PayPal、银行卡等收款入口。</p>
      </Card>

      <Card className="p-5">
        <h3 className="text-base font-semibold text-[var(--color-surface)]">新增收款方式</h3>
        <form action={createBindingAction} className="mt-3 grid gap-3 md:grid-cols-2">
          <select
            name="channel"
            required
            className="rounded-[var(--radius-sm)] border border-white/20 bg-black/20 px-3 py-2 text-sm text-[var(--color-surface)]"
          >
            {CHANNELS.map((channel) => (
              <option key={channel} value={channel}>
                {channel}
              </option>
            ))}
          </select>
          <input
            name="displayName"
            required
            placeholder="显示名称（如 微信商户）"
            className="rounded-[var(--radius-sm)] border border-white/20 bg-black/20 px-3 py-2 text-sm text-[var(--color-surface)] placeholder:text-[var(--color-surface)]/40"
          />
          <input
            name="accountName"
            placeholder="账户名"
            className="rounded-[var(--radius-sm)] border border-white/20 bg-black/20 px-3 py-2 text-sm text-[var(--color-surface)] placeholder:text-[var(--color-surface)]/40"
          />
          <input
            name="accountRef"
            placeholder="账号/商户号"
            className="rounded-[var(--radius-sm)] border border-white/20 bg-black/20 px-3 py-2 text-sm text-[var(--color-surface)] placeholder:text-[var(--color-surface)]/40"
          />
          <input
            name="qrCodeUrl"
            placeholder="二维码图片URL（可选）"
            className="md:col-span-2 rounded-[var(--radius-sm)] border border-white/20 bg-black/20 px-3 py-2 text-sm text-[var(--color-surface)] placeholder:text-[var(--color-surface)]/40"
          />
          <textarea
            name="instructions"
            placeholder="支付说明（可选）"
            rows={3}
            className="md:col-span-2 rounded-[var(--radius-sm)] border border-white/20 bg-black/20 px-3 py-2 text-sm text-[var(--color-surface)] placeholder:text-[var(--color-surface)]/40"
          />
          <button
            type="submit"
            className="md:col-span-2 rounded-[var(--radius-sm)] border border-white/22 bg-white/10 px-4 py-2 text-sm font-semibold text-[var(--color-surface)] transition hover:bg-white/16"
          >
            添加收款方式
          </button>
        </form>
      </Card>

      {bindings.map((item) => (
        <Card key={item.id} className="p-5">
          <form action={updateBindingAction} className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="id" value={item.id} />
            <div>
              <p className="text-xs text-[var(--color-surface)]/62">渠道</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-surface)]">{item.channel}</p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-[var(--color-surface)]/82">
              <input type="checkbox" name="enabled" defaultChecked={item.enabled} />
              启用
            </label>
            <input
              name="displayName"
              defaultValue={item.displayName}
              required
              placeholder="显示名称"
              className="rounded-[var(--radius-sm)] border border-white/20 bg-black/20 px-3 py-2 text-sm text-[var(--color-surface)]"
            />
            <input
              name="accountName"
              defaultValue={item.accountName ?? ""}
              placeholder="账户名"
              className="rounded-[var(--radius-sm)] border border-white/20 bg-black/20 px-3 py-2 text-sm text-[var(--color-surface)]"
            />
            <input
              name="accountRef"
              defaultValue={item.accountRef ?? ""}
              placeholder="账号/商户号"
              className="rounded-[var(--radius-sm)] border border-white/20 bg-black/20 px-3 py-2 text-sm text-[var(--color-surface)]"
            />
            <input
              name="qrCodeUrl"
              defaultValue={item.qrCodeUrl ?? ""}
              placeholder="二维码URL"
              className="rounded-[var(--radius-sm)] border border-white/20 bg-black/20 px-3 py-2 text-sm text-[var(--color-surface)]"
            />
            <textarea
              name="instructions"
              defaultValue={item.instructions ?? ""}
              rows={3}
              placeholder="支付说明"
              className="md:col-span-2 rounded-[var(--radius-sm)] border border-white/20 bg-black/20 px-3 py-2 text-sm text-[var(--color-surface)]"
            />
            <p className="md:col-span-2 text-xs text-[var(--color-surface)]/62">
              更新时间：{new Date(item.updatedAt).toLocaleString()}
            </p>
            <button
              type="submit"
              className="md:col-span-2 rounded-[var(--radius-sm)] border border-white/22 bg-white/10 px-4 py-2 text-sm font-semibold text-[var(--color-surface)] transition hover:bg-white/16"
            >
              保存
            </button>
          </form>
        </Card>
      ))}
    </div>
  );
}
