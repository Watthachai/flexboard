/*
  Warnings:

  - You are about to drop the column `ageBucket` on the `InventoryRaw` table. All the data in the column will be lost.
  - You are about to drop the column `daysAge` on the `InventoryRaw` table. All the data in the column will be lost.
  - You are about to drop the column `qty0To90` on the `InventoryRaw` table. All the data in the column will be lost.
  - You are about to drop the column `qty181To365` on the `InventoryRaw` table. All the data in the column will be lost.
  - You are about to drop the column `qty91To180` on the `InventoryRaw` table. All the data in the column will be lost.
  - You are about to drop the column `qtyOver365` on the `InventoryRaw` table. All the data in the column will be lost.
  - You are about to drop the column `totalValue` on the `InventoryRaw` table. All the data in the column will be lost.
  - You are about to drop the column `val0To90` on the `InventoryRaw` table. All the data in the column will be lost.
  - You are about to drop the column `val181To365` on the `InventoryRaw` table. All the data in the column will be lost.
  - You are about to drop the column `val91To180` on the `InventoryRaw` table. All the data in the column will be lost.
  - You are about to drop the column `valOver365` on the `InventoryRaw` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InventoryRaw" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dataDate" DATETIME NOT NULL,
    "corp" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "prod" TEXT NOT NULL,
    "unitName" TEXT NOT NULL,
    "docNumber" TEXT NOT NULL,
    "docDate" DATETIME NOT NULL,
    "qtyFromThisDoc" REAL NOT NULL,
    "averageCost" REAL NOT NULL
);
INSERT INTO "new_InventoryRaw" ("averageCost", "branch", "corp", "dataDate", "docDate", "docNumber", "id", "prod", "qtyFromThisDoc", "unitName") SELECT "averageCost", "branch", "corp", "dataDate", "docDate", "docNumber", "id", "prod", "qtyFromThisDoc", "unitName" FROM "InventoryRaw";
DROP TABLE "InventoryRaw";
ALTER TABLE "new_InventoryRaw" RENAME TO "InventoryRaw";
CREATE INDEX "InventoryRaw_dataDate_idx" ON "InventoryRaw"("dataDate");
CREATE INDEX "InventoryRaw_branch_idx" ON "InventoryRaw"("branch");
CREATE INDEX "InventoryRaw_prod_idx" ON "InventoryRaw"("prod");
CREATE INDEX "InventoryRaw_docNumber_idx" ON "InventoryRaw"("docNumber");
CREATE INDEX "InventoryRaw_corp_branch_idx" ON "InventoryRaw"("corp", "branch");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
