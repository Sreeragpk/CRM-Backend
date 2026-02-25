/*
  Warnings:

  - Made the column `dealLogId` on table `Deal` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Deal" ALTER COLUMN "dealLogId" SET NOT NULL;
