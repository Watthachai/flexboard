-- DropIndex
DROP INDEX "InventoryRaw_corp_branch_idx";

-- AlterTable
ALTER TABLE "InventoryRaw" ADD COLUMN "ageBucket" TEXT;
ALTER TABLE "InventoryRaw" ADD COLUMN "costSafe" REAL;
ALTER TABLE "InventoryRaw" ADD COLUMN "daysAge" INTEGER;
ALTER TABLE "InventoryRaw" ADD COLUMN "qtySafe" REAL;
ALTER TABLE "InventoryRaw" ADD COLUMN "totalValueRow" REAL;

-- CreateIndex
CREATE INDEX "InventoryRaw_ageBucket_idx" ON "InventoryRaw"("ageBucket");

-- CreateIndex
CREATE INDEX "InventoryRaw_corp_idx" ON "InventoryRaw"("corp");
