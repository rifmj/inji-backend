-- Auth-hardening data model (AuthIdentity / Apple models + User Saleor fields).
-- These models/columns were added to schema.prisma + code but a migration was
-- never generated, so the tables were missing on deployed databases and the
-- identity/session flow (resolveUserByIdentity) failed at runtime. Generated
-- via `prisma migrate diff` against the live dev DB.

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('phone', 'apple');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "userId" TEXT,
ALTER COLUMN "userPhone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "saleorEmail" TEXT NOT NULL,
ADD COLUMN     "saleorPasswordEnc" TEXT NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AuthIdentity" (
    "id" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "subject" TEXT NOT NULL,
    "email" TEXT,
    "rawData" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppleAuthNonce" (
    "id" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppleAuthNonce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppleSession" (
    "id" TEXT NOT NULL,
    "appleSub" TEXT NOT NULL,
    "refreshTokenEnc" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AppleSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthIdentity_userId_idx" ON "AuthIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthIdentity_provider_subject_key" ON "AuthIdentity"("provider", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "AppleAuthNonce_nonce_key" ON "AppleAuthNonce"("nonce");

-- CreateIndex
CREATE INDEX "AppleSession_userId_idx" ON "AppleSession"("userId");

-- CreateIndex
CREATE INDEX "AppleSession_appleSub_idx" ON "AppleSession"("appleSub");

-- CreateIndex
CREATE INDEX "Invoice_userId_idx" ON "Invoice"("userId");

-- CreateIndex
CREATE INDEX "SavedCard_userId_idx" ON "SavedCard"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_saleorEmail_key" ON "User"("saleorEmail");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "UserDevice_userId_idx" ON "UserDevice"("userId");
