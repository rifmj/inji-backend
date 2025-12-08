-- CreateTable
CREATE TABLE "SavedCard" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "cardToken" TEXT NOT NULL,
    "cardLastFour" TEXT NOT NULL,

    CONSTRAINT "SavedCard_pkey" PRIMARY KEY ("id")
);
