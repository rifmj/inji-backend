-- CreateEnum
CREATE TYPE "SmsChannel" AS ENUM ('sms', 'whatsapp');

-- CreateTable
CREATE TABLE "SmsRequestCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "channel" "SmsChannel",

    CONSTRAINT "SmsRequestCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallWaitCode" (
    "id" TEXT NOT NULL,
    "userPhone" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallWaitCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hashedRefreshToken" TEXT,
    "phone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DOUBLE PRECISION NOT NULL,
    "userPhone" TEXT NOT NULL,
    "checkoutId" TEXT,
    "status" INTEGER,
    "operationUrl" TEXT,
    "referenceId" TEXT,
    "key" TEXT,
    "userComment" TEXT,
    "products" JSONB,
    "data" JSONB,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDevice" (
    "id" TEXT NOT NULL,
    "pushToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "barcode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "erpId" TEXT,
    "saleorId" TEXT,
    "price" DOUBLE PRECISION,
    "costPrice" DOUBLE PRECISION,
    "isProcessedDietaGram" BOOLEAN NOT NULL DEFAULT false,
    "dietaGram" JSONB,
    "isProcessedGoogle" BOOLEAN NOT NULL DEFAULT false,
    "google" JSONB,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramAuthRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hash" TEXT NOT NULL,
    "phone" TEXT,
    "data" JSONB,

    CONSTRAINT "TelegramAuthRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryEstimate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "route" JSONB,
    "selectedClass" TEXT,
    "phone" TEXT,
    "serviceLevels" JSONB,
    "data" JSONB,

    CONSTRAINT "DeliveryEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaspiPaymentRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "phone" TEXT,
    "checkoutData" JSONB,
    "amount" DOUBLE PRECISION,

    CONSTRAINT "KaspiPaymentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
