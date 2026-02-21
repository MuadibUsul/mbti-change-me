import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@mbtichange.local";
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    console.log("Seed user already exists:", email);
    return;
  }

  const passwordHash = await bcrypt.hash("demo1234", 10);
  await prisma.user.create({
    data: {
      email,
      name: "Demo",
      passwordHash,
    },
  });
  console.log("Seed user created:", email, "password: demo1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
