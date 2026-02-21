-- CreateEnum
CREATE TYPE "PaymentChannel" AS ENUM ('WECHAT', 'ALIPAY', 'DOUYIN', 'STRIPE', 'PAYPAL', 'BANK', 'CUSTOM');

-- CreateTable
CREATE TABLE "EmailVerificationCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentBinding" (
    "id" TEXT NOT NULL,
    "channel" "PaymentChannel" NOT NULL,
    "displayName" TEXT NOT NULL,
    "accountName" TEXT,
    "accountRef" TEXT,
    "qrCodeUrl" TEXT,
    "instructions" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrafficEvent" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "userAgent" TEXT,
    "sessionKey" TEXT,
    "ipHash" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrafficEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailVerificationCode_email_createdAt_idx" ON "EmailVerificationCode"("email", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "EmailVerificationCode_email_consumedAt_expiresAt_idx" ON "EmailVerificationCode"("email", "consumedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "PaymentBinding_channel_enabled_idx" ON "PaymentBinding"("channel", "enabled");

-- CreateIndex
CREATE INDEX "PaymentBinding_updatedAt_idx" ON "PaymentBinding"("updatedAt" DESC);

-- CreateIndex
CREATE INDEX "TrafficEvent_createdAt_idx" ON "TrafficEvent"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "TrafficEvent_path_createdAt_idx" ON "TrafficEvent"("path", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "TrafficEvent_sessionKey_createdAt_idx" ON "TrafficEvent"("sessionKey", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "TrafficEvent_userId_createdAt_idx" ON "TrafficEvent"("userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "TrafficEvent" ADD CONSTRAINT "TrafficEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
