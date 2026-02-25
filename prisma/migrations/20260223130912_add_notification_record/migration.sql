-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "recordId" TEXT;

-- CreateIndex
CREATE INDEX "Notification_recordId_idx" ON "Notification"("recordId");
