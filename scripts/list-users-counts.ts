import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const users = await p.user.findMany({
    select: {
      id: true,
      email: true,
      _count: { select: { testSessions: true, avatarTokens: true } },
      testSessions: {
        where: { status: "COMPLETED" },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  console.log(JSON.stringify(users.map((u) => ({
    email: u.email,
    completed: u.testSessions.length,
    testSessions: u._count.testSessions,
    tokens: u._count.avatarTokens,
  })), null, 2));
  await p.$disconnect();
})();
