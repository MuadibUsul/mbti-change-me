import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function buildOAuthProviders() {
  const providers: ReturnType<typeof NextAuth>[never][] = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }) as never,
    );
  }

  if (process.env.WECHAT_CLIENT_ID && process.env.WECHAT_CLIENT_SECRET) {
    providers.push({
      id: "wechat",
      name: "WeChat",
      type: "oauth",
      clientId: process.env.WECHAT_CLIENT_ID,
      clientSecret: process.env.WECHAT_CLIENT_SECRET,
      authorization: {
        url: "https://open.weixin.qq.com/connect/qrconnect",
        params: {
          scope: "snsapi_login",
          response_type: "code",
        },
      },
      token: "https://api.weixin.qq.com/sns/oauth2/access_token",
      userinfo: "https://api.weixin.qq.com/sns/userinfo",
      checks: ["state"],
      profile(profile: Record<string, unknown>) {
        const openId = String(profile.openid ?? profile.unionid ?? "");
        const unionId = String(profile.unionid ?? openId);
        const email = `wechat_${unionId}@oauth.personaflux.local`;
        return {
          id: openId || unionId,
          name: String(profile.nickname ?? "微信用户"),
          email,
          image: typeof profile.headimgurl === "string" ? profile.headimgurl : null,
        };
      },
    } as never);
  }

  if (process.env.DOUYIN_CLIENT_ID && process.env.DOUYIN_CLIENT_SECRET) {
    providers.push({
      id: "douyin",
      name: "Douyin",
      type: "oauth",
      clientId: process.env.DOUYIN_CLIENT_ID,
      clientSecret: process.env.DOUYIN_CLIENT_SECRET,
      authorization: {
        url: "https://open.douyin.com/platform/oauth/connect/",
        params: {
          scope: "user_info",
          response_type: "code",
        },
      },
      token: "https://open.douyin.com/oauth/access_token/",
      userinfo: "https://open.douyin.com/oauth/userinfo/",
      checks: ["state"],
      profile(raw: Record<string, unknown>) {
        const data =
          raw.data && typeof raw.data === "object" ? (raw.data as Record<string, unknown>) : raw;
        const openId = String(data.open_id ?? data.openid ?? data.union_id ?? data.uid ?? "");
        const email = `douyin_${openId || "user"}@oauth.personaflux.local`;
        return {
          id: openId || "douyin-user",
          name: String(data.nickname ?? data.display_name ?? "抖音用户"),
          email,
          image: typeof data.avatar === "string" ? data.avatar : null,
        };
      },
    } as never);
  }

  return providers;
}

async function ensureOAuthUser(params: {
  provider: string;
  providerAccountId: string;
  name?: string | null;
  email?: string | null;
}) {
  const email =
    params.email?.toLowerCase().trim() ||
    `${params.provider}_${params.providerAccountId}@oauth.personaflux.local`;
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });
  if (existing) return existing;

  const passwordHash = await hashPassword(`oauth:${params.provider}:${params.providerAccountId}`);
  return prisma.user.create({
    data: {
      email,
      name: params.name?.trim() || `${params.provider}_${params.providerAccountId.slice(0, 6)}`,
      passwordHash,
    },
    select: { id: true, email: true, name: true },
  });
}

const providers = [
  Credentials({
    name: "Email + Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const parsed = signInSchema.safeParse(credentials);
      if (!parsed.success) return null;

      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email.toLowerCase() },
      });
      if (!user) return null;

      const matched = await verifyPassword(parsed.data.password, user.passwordHash);
      if (!matched) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name ?? user.email.split("@")[0],
      };
    },
  }),
  ...buildOAuthProviders(),
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && account.provider !== "credentials") {
        const ensured = await ensureOAuthUser({
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          name: user?.name,
          email: user?.email,
        });
        token.id = ensured.id;
        token.email = ensured.email;
        token.name = ensured.name ?? token.name;
        return token;
      }

      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

