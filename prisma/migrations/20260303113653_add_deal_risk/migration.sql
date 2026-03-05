-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "DealRisk" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "factors" JSONB NOT NULL,
    "playbook" JSONB NOT NULL,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealRiskHistory" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "factors" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealRiskHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DealRisk_dealId_key" ON "DealRisk"("dealId");

-- CreateIndex
CREATE INDEX "DealRisk_riskLevel_idx" ON "DealRisk"("riskLevel");

-- CreateIndex
CREATE INDEX "DealRiskHistory_dealId_idx" ON "DealRiskHistory"("dealId");

-- CreateIndex
CREATE INDEX "DealRiskHistory_createdAt_idx" ON "DealRiskHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "DealRisk" ADD CONSTRAINT "DealRisk_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealRiskHistory" ADD CONSTRAINT "DealRiskHistory_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
