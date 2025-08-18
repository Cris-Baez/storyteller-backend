/*
  Warnings:

  - A unique constraint covering the columns `[accountId,date]` on the table `instagram_metrics` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "accountId_date" ON "public"."instagram_metrics"("accountId", "date");
