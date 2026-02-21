import Link from "next/link";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin-auth";
import { parsePetModel } from "@/lib/pet-model";
import { prisma } from "@/lib/prisma";

const navItems = [
  { href: "/test/new", label: "新测验" },
  { href: "/timeline", label: "时间轴" },
];

function MiniProfileAvatar({
  palette,
  eyeStyle,
}: {
  palette: { body: string; accent: string; line: string; skin: string };
  eyeStyle: "dot" | "smile" | "sparkle" | "focus";
}) {
  const eyeMarkup =
    eyeStyle === "smile"
      ? (
          <>
            <path d="M12 18 q2 2 4 0" stroke={palette.line} strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d="M24 18 q2 2 4 0" stroke={palette.line} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </>
        )
      : (
          <>
            <circle cx="14" cy="18" r={eyeStyle === "sparkle" ? 1.8 : 1.6} fill={palette.line} />
            <circle cx="26" cy="18" r={eyeStyle === "focus" ? 1.2 : 1.6} fill={palette.line} />
          </>
        );

  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10 rounded-full">
      <defs>
        <radialGradient id="avatar-glow" cx="50%" cy="36%" r="65%">
          <stop offset="0%" stopColor={palette.accent} stopOpacity="0.3" />
          <stop offset="100%" stopColor={palette.body} stopOpacity="0.9" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="20" fill="url(#avatar-glow)" />
      <ellipse cx="20" cy="24.5" rx="11.2" ry="8.8" fill={palette.body} />
      <circle cx="20" cy="16" r="9.2" fill={palette.skin} />
      {eyeMarkup}
      <path d="M16 24 q4 3 8 0" stroke={palette.line} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export async function SiteHeader() {
  const session = await auth();
  const latestToken = session?.user?.id
    ? await prisma.avatarToken.findFirst({
        where: { userId: session.user.id },
        orderBy: { tokenIndex: "desc" },
        select: { derivedStats: true },
      })
    : null;
  const latestPetModel = parsePetModel(
    (latestToken?.derivedStats as {
      petModel?: unknown;
    } | null)?.petModel,
  );

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="group inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-glow)] shadow-[0_0_14px_var(--color-glow)]" />
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-surface)]/90 md:text-base">
            Persona Flux
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[var(--radius-sm)] border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-[var(--color-surface)]/80 transition hover:bg-white/14 hover:text-[var(--color-surface)] md:text-sm"
            >
              {item.label}
            </Link>
          ))}

          {session?.user?.email && isAdminEmail(session.user.email) ? (
            <Link
              href="/admin"
              className="rounded-[var(--radius-sm)] border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-[var(--color-surface)]/80 transition hover:bg-white/14 hover:text-[var(--color-surface)] md:text-sm"
            >
              后台
            </Link>
          ) : null}

          {session?.user ? (
            <Link
              href="/settings"
              aria-label="进入个人中心"
              className="rounded-full border border-white/24 bg-white/8 p-0.5 transition hover:scale-[1.03] hover:bg-white/16"
            >
              {latestPetModel ? (
                <MiniProfileAvatar
                  palette={{
                    body: latestPetModel.palette.body,
                    accent: latestPetModel.palette.accent,
                    line: latestPetModel.palette.line,
                    skin: latestPetModel.palette.skin,
                  }}
                  eyeStyle={latestPetModel.eyeStyle}
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-xs font-semibold text-[var(--color-surface)]/82">
                  我
                </div>
              )}
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-[var(--radius-sm)] border border-white/20 px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-[var(--color-surface)]/86 transition hover:bg-white/14 md:text-sm"
            >
              登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
