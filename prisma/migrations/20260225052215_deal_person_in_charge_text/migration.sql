/*
  Warnings:

  - You are about to drop the column `personInChargeId` on the `Deal` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Deal" DROP CONSTRAINT "Deal_personInChargeId_fkey";

-- AlterTable
ALTER TABLE "Deal" DROP COLUMN "personInChargeId",
ADD COLUMN     "personInCharge" TEXT;
