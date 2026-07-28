-- CreateTable
CREATE TABLE "CardContract" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "clientNumber" TEXT NOT NULL,
    "liabilityContract" TEXT NOT NULL,
    "issuingContract" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "expiryDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardContract_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CardContract" ADD CONSTRAINT "CardContract_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
