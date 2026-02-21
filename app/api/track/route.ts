import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const trackSchema = z.object({
  path: z.string().min(1).max(500),
  referrer: z.string().max(1000).optional(),
  sessionKey: z.string().max(120).optional(),
});

function hashIp(ip: string) {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = trackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    const { path, referrer, sessionKey } = parsed.data;
    if (path.startsWith("/api") || path.startsWith("/_next")) {
      return NextResponse.json({ ok: true });
    }

    const session = await auth();
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";

    await prisma.trafficEvent.create({
      data: {
        path,
        referrer: referrer?.slice(0, 1000),
        sessionKey: sessionKey?.slice(0, 120),
        userAgent: req.headers.get("user-agent")?.slice(0, 512),
        ipHash: ip ? hashIp(ip) : null,
        userId: session?.user?.id ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
