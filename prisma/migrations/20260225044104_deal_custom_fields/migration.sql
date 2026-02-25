/*
  Warnings:

  - The values [QUALIFICATION,NEEDS_ANALYSIS,VALUE_PROPOSITION,IDENTIFY_DECISION_MAKERS,PROPOSAL_PRICE_QUOTE,NEGOTIATION_REVIEW] on the enum `DealStage` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[dealLogId]` on the table `Deal` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProductGroup" AS ENUM ('MTS_PRO', 'MTS_STANDARD', 'FACTEYES', 'MTS_ASSEMBLY');

-- CreateEnum
CREATE TYPE "Weightage" AS ENUM ('PROBABILITY', 'BALLPARK_OFFER', 'BUDGETARY_OFFER', 'DETAIL_L1', 'DETAIL_L2', 'FIRM_AFTER_PRICE_FINALIZATION', 'TECHNICAL_ONLY');

-- AlterEnum
BEGIN;
CREATE TYPE "DealStage_new" AS ENUM ('RFQ', 'VISIT_MEETING', 'PREVIEW', 'REGRETTED', 'TECHNICAL_PROPOSAL', 'COMMERCIAL_PROPOSAL', 'REVIEW_FEEDBACK', 'MOVED_TO_PURCHASE', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST', 'CLOSED_LOST_TO_COMPETITION');
ALTER TABLE "Deal" ALTER COLUMN "stage" TYPE "DealStage_new" USING ("stage"::text::"DealStage_new");
ALTER TYPE "DealStage" RENAME TO "DealStage_old";
ALTER TYPE "DealStage_new" RENAME TO "DealStage";
DROP TYPE "DealStage_old";
COMMIT;

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "dealLogId" TEXT,
ADD COLUMN     "personInChargeId" TEXT,
ADD COLUMN     "productGroup" "ProductGroup",
ADD COLUMN     "weightage" "Weightage";

-- CreateIndex
CREATE UNIQUE INDEX "Deal_dealLogId_key" ON "Deal"("dealLogId");

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_personInChargeId_fkey" FOREIGN KEY ("personInChargeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
