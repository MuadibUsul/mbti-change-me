-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('DRAFT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Dimension" AS ENUM ('EI', 'SN', 'TF', 'JP');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "styleDNA" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'DRAFT',
    "questionCount" INTEGER NOT NULL,
    "mbtiType" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "completionSeconds" INTEGER,
    "behaviorStats" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "dimension" "Dimension" NOT NULL,
    "direction" INTEGER NOT NULL,
    "reverseScoring" BOOLEAN NOT NULL DEFAULT false,
    "choices" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "choice" INTEGER NOT NULL,
    "mappedValue" INTEGER NOT NULL,
    "elapsedMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DimensionScore" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "dimension" "Dimension" NOT NULL,
    "rawScore" DOUBLE PRECISION NOT NULL,
    "normalizedScore" DOUBLE PRECISION NOT NULL,
    "letter" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DimensionScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvatarToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tokenIndex" INTEGER NOT NULL,
    "seed" TEXT NOT NULL,
    "regions" JSONB NOT NULL,
    "regionColors" JSONB NOT NULL,
    "textureOverlay" TEXT NOT NULL,
    "derivedStats" JSONB NOT NULL,
    "svg" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvatarToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorAdvice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "insights" JSONB NOT NULL,
    "actionSuggestions" JSONB NOT NULL,
    "reflectionQuestion" TEXT NOT NULL,
    "microPlan" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorAdvice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "TestSession_userId_createdAt_idx" ON "TestSession"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Question_sessionId_dimension_idx" ON "Question"("sessionId", "dimension");

-- CreateIndex
CREATE UNIQUE INDEX "Question_sessionId_orderIndex_key" ON "Question"("sessionId", "orderIndex");

-- CreateIndex
CREATE INDEX "Answer_userId_createdAt_idx" ON "Answer"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Answer_sessionId_questionId_key" ON "Answer"("sessionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "DimensionScore_sessionId_dimension_key" ON "DimensionScore"("sessionId", "dimension");

-- CreateIndex
CREATE UNIQUE INDEX "AvatarToken_sessionId_key" ON "AvatarToken"("sessionId");

-- CreateIndex
CREATE INDEX "AvatarToken_userId_generatedAt_idx" ON "AvatarToken"("userId", "generatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "AvatarToken_userId_tokenIndex_key" ON "AvatarToken"("userId", "tokenIndex");

-- CreateIndex
CREATE UNIQUE INDEX "MentorAdvice_sessionId_key" ON "MentorAdvice"("sessionId");

-- CreateIndex
CREATE INDEX "MentorAdvice_userId_generatedAt_idx" ON "MentorAdvice"("userId", "generatedAt" DESC);

-- AddForeignKey
ALTER TABLE "TestSession" ADD CONSTRAINT "TestSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DimensionScore" ADD CONSTRAINT "DimensionScore_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarToken" ADD CONSTRAINT "AvatarToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarToken" ADD CONSTRAINT "AvatarToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorAdvice" ADD CONSTRAINT "MentorAdvice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorAdvice" ADD CONSTRAINT "MentorAdvice_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

