-- CreateIndex
CREATE INDEX "Card_cardName_idx" ON "Card"("cardName");

-- CreateIndex
CREATE INDEX "Card_expiryDate_idx" ON "Card"("expiryDate");

-- CreateIndex
CREATE INDEX "Card_createdAt_idx" ON "Card"("createdAt");

-- CreateIndex
CREATE INDEX "Card_issuingContractId_idx" ON "Card"("issuingContractId");

-- CreateIndex
CREATE INDEX "Contract_clientNumber_idx" ON "Contract"("clientNumber");

-- CreateIndex
CREATE INDEX "Contract_contractName_idx" ON "Contract"("contractName");

-- CreateIndex
CREATE INDEX "Contract_productCode_idx" ON "Contract"("productCode");

-- CreateIndex
CREATE INDEX "Contract_type_idx" ON "Contract"("type");

-- CreateIndex
CREATE INDEX "Contract_createdAt_idx" ON "Contract"("createdAt");

-- CreateIndex
CREATE INDEX "Contract_userId_idx" ON "Contract"("userId");
