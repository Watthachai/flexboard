/**
 * Example: How to use Dynamic Mapping with FlexBoard Engine
 *
 * This example shows how to configure reference tables and use dynamic lookups
 * in transform expressions, exactly like the PVS Inventory Aging Report config.
 */

import { processDataWithManifest } from "../apps/onprem-viewer/src/lib/engine";

// Sample inventory data
const sampleInventoryData = [
  {
    DataDate: "2024-08-21",
    Corp: "บริษัท ABC",
    Branch: "สาขาเซ็นทรัล",
    Prod: "AE001-วัตถุระเบิด (ยี่ห้อA)",
    DocNumber: "DOC001",
    DocDate: "2024-01-15",
    QtyFromThisDoc: 100,
    AverageCost: 1500,
  },
  {
    DataDate: "2024-08-21",
    Corp: "บริษัท ABC",
    Branch: "สาขาบางนา",
    Prod: "PVI-ดินไฟฟ้า ชนิด IED",
    DocNumber: "DOC002",
    DocDate: "2024-03-10",
    QtyFromThisDoc: 50,
    AverageCost: 2500,
  },
  {
    DataDate: "2024-08-21",
    Corp: "บริษัท ABC",
    Branch: "สาขาเซ็นทรัล",
    Prod: "Unknown Product",
    DocNumber: "DOC003",
    DocDate: "2024-07-01",
    QtyFromThisDoc: 25,
    AverageCost: 800,
  },
];

// Manifest configuration with dynamic mapping
const dynamicMappingManifest = {
  settings: {
    nearExpiryDays: 45,
    criticalDays: 14,
  },

  // Reference tables for dynamic lookup
  referenceTables: {
    "shelf-life-map": {
      type: "inline" as const,
      key: "Prod",
      valueField: "ShelfLifeDays",
      defaultValue: 365,
      rows: [
        {
          Prod: "AE001-วัตถุระเบิด (ยี่ห้อA)",
          ShelfLifeDays: 365,
        },
        {
          Prod: "PVI-ดินไฟฟ้า ชนิด IED",
          ShelfLifeDays: 180,
        },
        // Unknown products will use defaultValue: 365
      ],
    },
  },

  // Transform expressions using dynamic mapping
  transforms: [
    {
      expr: "formatDate(DataDate,'yyyy-MM')",
      as: "DataMonth",
    },
    {
      // Dynamic lookup with fallback
      as: "ShelfLifeDaysResolved",
      expr: "coalesce(lookupDs('shelf-life-map','Prod','ShelfLifeDays'), 365)",
    },
    {
      as: "ExpiryDate",
      expr: "addDays(DocDate, ShelfLifeDaysResolved)",
    },
    {
      as: "DaysToExpire",
      expr: "dateDiff(DataDate, ExpiryDate, 'days')",
    },
    {
      as: "NearExpiryFlag",
      expr: "iif(DaysToExpire <= settings.nearExpiryDays && DaysToExpire >= 0, 1, 0)",
    },
    {
      as: "ExpiredFlag",
      expr: "iif(DaysToExpire < 0, 1, 0)",
    },
  ],

  dataSources: [
    {
      id: "uploaded-xml",
      fieldTypes: {
        DataDate: "date",
        DocDate: "date",
        QtyFromThisDoc: "number",
        AverageCost: "number",
        Corp: "string",
        Branch: "string",
        Prod: "string",
        DocNumber: "string",
      },
      dateParsing: {
        DataDate: "yyyy-MM-dd",
        DocDate: "yyyy-MM-dd",
      },
    },
  ],
};

// Process the data
function demonstrateDynamicMapping() {
  console.log("=== Original Data ===");
  console.table(sampleInventoryData);

  console.log("\n=== Processing with Dynamic Mapping ===");
  const processedData = processDataWithManifest(
    sampleInventoryData,
    dynamicMappingManifest,
    "uploaded-xml"
  );

  console.log("\n=== Processed Data with Dynamic Lookups ===");
  console.table(
    processedData.map((row) => ({
      Prod: row.Prod,
      DocDate: row.DocDate,
      DataDate: row.DataDate,
      ShelfLifeDaysResolved: row.ShelfLifeDaysResolved, // ← จาก lookup
      ExpiryDate: row.ExpiryDate,
      DaysToExpire: row.DaysToExpire,
      NearExpiryFlag: row.NearExpiryFlag,
      ExpiredFlag: row.ExpiredFlag,
    }))
  );

  console.log("\n=== Analysis ===");
  processedData.forEach((row) => {
    const status = row.ExpiredFlag
      ? "EXPIRED"
      : row.NearExpiryFlag
        ? "NEAR_EXPIRY"
        : "OK";
    console.log(`${row.Prod}: ${row.DaysToExpire} days → ${status}`);
  });
}

// Export for usage
export {
  sampleInventoryData,
  dynamicMappingManifest,
  demonstrateDynamicMapping,
};

/*
=== Key Features Demonstrated ===

1. Reference Tables (referenceTables):
   - inline type: ข้อมูล mapping ที่ฝังในตัว manifest
   - key: field ที่ใช้ lookup
   - valueField: field ที่จะ return
   - defaultValue: ค่า default เมื่อไม่เจอ

2. Dynamic Lookup Functions:
   - lookupDs('table-name', 'key-field', 'value-field')
   - coalesce(...values) → ใช้ค่าแรกที่ไม่เป็น null
   - iif(condition, true-value, false-value)

3. Settings Integration:
   - settings.nearExpiryDays → อ้างอิงค่าจาก config
   - settings.criticalDays → dynamic configuration

4. Complex Expressions:
   - รองรับ compound conditions (&&)
   - รองรับ nested functions
   - รองรับ date operations

=== Usage in Real Dashboard ===

```json
{
  "referenceTables": {
    "category-mapping": {
      "type": "local",        // อ่านจากไฟล์
      "key": "ProductCode",
      "valueField": "Category",
      "defaultValue": "OTHER"
    }
  },
  "transforms": [
    {
      "as": "ProductCategory",
      "expr": "coalesce(lookupDs('category-mapping','ProductCode','Category'), 'UNKNOWN')"
    }
  ]
}
```
*/
