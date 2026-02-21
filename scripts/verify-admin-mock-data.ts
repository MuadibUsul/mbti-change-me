import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@starringcapital.com";
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      _count: {
        select: {
          testSessions: true,
          avatarTokens: true,
          mentorAdvice: true,
          answers: true,
        },
      },
    },
  });

  if (!user) {
    console.log("NO_USER");
    return;
  }

  const completed = await prisma.testSession.count({
    where: { userId: user.id, status: "COMPLETED" },
  });

  const recent = await prisma.testSession.findMany({
    where: { userId: user.id, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      id: true,
      mbtiType: true,
      createdAt: true,
    },
  });

  console.log(
    JSON.stringify(
      {
        email: user.email,
        hasStyleDNA: Boolean(user.styleDNA),
        completed,
        counts: user._count,
        recent,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
