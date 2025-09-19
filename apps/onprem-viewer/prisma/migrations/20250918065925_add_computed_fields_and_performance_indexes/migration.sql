-- CreateTable
CREATE TABLE "ImportLog" (
    "filename" TEXT NOT NULL PRIMARY KEY,
    "lastMtime" BIGINT NOT NULL,
    "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "recordsCreated" INTEGER NOT NULL DEFAULT 0,
    "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
    "recordsDeleted" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS'
);

-- CreateTable
CREATE TABLE "InventoryRaw" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dataDate" DATETIME NOT NULL,
    "corp" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "prod" TEXT NOT NULL,
    "unitName" TEXT NOT NULL,
    "docNumber" TEXT NOT NULL,
    "docDate" DATETIME NOT NULL,
    "qtyFromThisDoc" REAL NOT NULL,
    "averageCost" REAL NOT NULL,
    "daysAge" INTEGER,
    "ageBucket" TEXT,
    "totalValue" REAL,
    "qty0To90" REAL,
    "qty91To180" REAL,
    "qty181To365" REAL,
    "qtyOver365" REAL,
    "val0To90" REAL,
    "val91To180" REAL,
    "val181To365" REAL,
    "valOver365" REAL
);

-- CreateIndex
CREATE INDEX "InventoryRaw_dataDate_idx" ON "InventoryRaw"("dataDate");

-- CreateIndex
CREATE INDEX "InventoryRaw_branch_idx" ON "InventoryRaw"("branch");

-- CreateIndex
CREATE INDEX "InventoryRaw_prod_idx" ON "InventoryRaw"("prod");

-- CreateIndex
CREATE INDEX "InventoryRaw_docNumber_idx" ON "InventoryRaw"("docNumber");

-- CreateIndex
CREATE INDEX "InventoryRaw_ageBucket_idx" ON "InventoryRaw"("ageBucket");

-- CreateIndex
CREATE INDEX "InventoryRaw_daysAge_idx" ON "InventoryRaw"("daysAge");

-- CreateIndex
CREATE INDEX "InventoryRaw_corp_branch_idx" ON "InventoryRaw"("corp", "branch");
