import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Plus_Jakarta_Sans } from "next/font/google";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { TrafficTracker } from "@/components/traffic-tracker";
import { VisualSystemProvider } from "@/components/visual-system-provider";
import { prisma } from "@/lib/prisma";
import { parseStyleDNA } from "@/lib/style-dna";
import { parseBehaviorStats, scoreMapFromRows } from "@/lib/visual-system";
import "./globals.css";

const fontGeo = Manrope({
  variable: "--font-geo",
  subsets: ["latin"],
});

const fontSoft = Plus_Jakarta_Sans({
  variable: "--font-soft",
  subsets: ["latin"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "MBTI \u4eba\u683c\u8f68\u8ff9\u5b9e\u9a8c\u5ba4",
  description: "\u957f\u671f\u4eba\u683c\u6d4b\u8bd5\u3001\u98ce\u683c\u57fa\u56e0\u3001\u5c0f\u4eba\u6f14\u5316\u4e0e\u884c\u52a8\u5efa\u8bae\u4e00\u4f53\u5316\u5e73\u53f0\u3002",
};

async function getVisualData(userId?: string) {
  if (!userId) {
    return {
      styleDNA: null,
      behaviorStats: null,
      latestScores: null,
      tokenCount: 0,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      styleDNA: true,
      _count: {
        select: {
          avatarTokens: true,
        },
      },
      testSessions: {
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          behaviorStats: true,
          dimensionScores: {
            select: {
              dimension: true,
              normalizedScore: true,
            },
          },
        },
      },
    },
  });

  const latest = user?.testSessions?.[0];

  return {
    styleDNA: parseStyleDNA(user?.styleDNA ?? null),
    behaviorStats: parseBehaviorStats(latest?.behaviorStats),
    latestScores: latest ? scoreMapFromRows(latest.dimensionScores) : null,
    tokenCount: user?._count.avatarTokens ?? 0,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const visualData = await getVisualData(session?.user?.id);
  const { styleDNA, behaviorStats, latestScores, tokenCount } = visualData;

  return (
    <html lang="zh-CN">
      <body className={`${fontGeo.variable} ${fontSoft.variable} ${monoFont.variable}`}>
        <VisualSystemProvider
          styleDNA={styleDNA}
          behaviorStats={behaviorStats}
          latestScores={latestScores}
          tokenCount={tokenCount}
        >
          <TrafficTracker />
          <SiteHeader />
          <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-12 pt-8 md:px-6">{children}</main>
        </VisualSystemProvider>
      </body>
    </html>
  );
}
