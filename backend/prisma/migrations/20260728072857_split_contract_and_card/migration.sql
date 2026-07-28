/*
  Warnings:

  - You are about to drop the `CardContract` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('LIABILITY', 'ISSUING');

-- DropForeignKey
ALTER TABLE "CardContract" DROP CONSTRAINT "CardContract_userId_fkey";

-- DropTable
DROP TABLE "CardContract";

-- CreateTable
CREATE TABLE "Contract" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "clientNumber" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "applicationNumber" TEXT,
    "type" "ContractType" NOT NULL,
    "productCode" TEXT,
    "contractName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentContractId" INTEGER,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" SERIAL NOT NULL,
    "issuingContractId" INTEGER NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "expiryDate" TEXT,
    "sequenceNumber" TEXT,
    "cardName" TEXT,
    "embossedFirstName" TEXT,
    "embossedLastName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contract_contractNumber_key" ON "Contract"("contractNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Card_cardNumber_key" ON "Card"("cardNumber");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_parentContractId_fkey" FOREIGN KEY ("parentContractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_issuingContractId_fkey" FOREIGN KEY ("issuingContractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
