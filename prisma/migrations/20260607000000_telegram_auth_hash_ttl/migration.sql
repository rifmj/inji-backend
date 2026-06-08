-- AlterTable
ALTER TABLE "TelegramAuthRequest" ADD COLUMN "expiresAt" TIMESTAMP(3),
ADD COLUMN "usedAt" TIMESTAMP(3);
