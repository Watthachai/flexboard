# Money Formatting Guide

## 🎯 Overview

ระบบ FlexBoard ตอนนี้รองรับการฟอร์แมตเงินและตัวเลขแบบอัตโนมัติ 2 วิธี:

1. **Config-based formatting** - กำหนดผ่าน manifest.json
2. **Auto-formatting** - ระบบจดจำคอลัมน์เงินอัตโนมัติ

## ✨ Auto-Formatting Features

### คอลัมน์ที่ระบบจดจำอัตโนมัติ

คอลัมน์ที่มีชื่อประกอบด้วยคำเหล่านี้จะถูกฟอร์แมตเป็นเงินอัตโนมัติ:

- `value`, `amount`, `total`, `price`, `cost`
- `มูลค่า`, `ราคา`, `รวม` (ภาษาไทย)

### การฟอร์แมตอัตโนมัติ

- **จอแสดงผล**: 1,234.56 (คอมม่า + 2 ทศนิยม + ชิดขวา)
- **Excel Export**: Accounting format พร้อม right-align
- **Totals Row**: ฟอร์แมตเงินอัตโนมัติ
- **Filter Dropdown**: ปิดใช้งานสำหรับคอลัมน์เงิน (เพราะไม่เหมาะกับการกรอง)

## 🛠️ Config-Based Formatting

### 1. กำหนด Formatters ใน manifest.json

```json
{
  "formatters": {
    "money": {
      "kind": "number",
      "precision": 2,
      "thousandsSep": ",",
      "prefix": "",
      "suffix": ""
    },
    "int": {
      "kind": "number",
      "precision": 0,
      "thousandsSep": ","
    },
    "percent": {
      "kind": "number",
      "precision": 1,
      "thousandsSep": false,
      "suffix": "%"
    }
  }
}
```

### 2. ใช้ใน Table Widget

```json
{
  "type": "table",
  "title": "📊 Inventory Report",
  "display": {
    "showTotalsRow": true,
    "totalsAgg": {
      "Total Value": "sum",
      "0-90 Days: Value": "sum",
      "91-180 Days: Value": "sum",
      "181-365 Days: Value": "sum",
      "Over 365 Days: Value": "sum"
    },
    "columnAlignment": {
      "Total Value": "right",
      "0-90 Days: Value": "right",
      "91-180 Days: Value": "right",
      "181-365 Days: Value": "right",
      "Over 365 Days: Value": "right"
    },
    "columnFormatters": {
      "Total Value": "money",
      "0-90 Days: Value": "money",
      "91-180 Days: Value": "money",
      "181-365 Days: Value": "money",
      "Over 365 Days: Value": "money",
      "Quantity": "int",
      "Growth Rate": "percent"
    }
  }
}
```

## 📋 Column Name Examples

### ✅ Auto-detected Money Columns

- `Total Value`, `Value`, `Amount`
- `Price`, `Cost`, `Sales Amount`
- `0-90 Days: Value`, `Over 365 Days: Value`
- `มูลค่ารวม`, `ราคาขาย`, `ต้นทุน`

### ✅ Manual Override Required

- `Revenue_2024`, `SALES_AMT` (ชื่อแปลก ๆ)
- `Col_15`, `Field_Value` (ชื่อทั่วไป)
- คอลัมน์ที่ต้องการฟอร์แมตพิเศษ

## 🎨 Display Features

### Table Display

- **Money columns**: คอมม่า + 2 ทศนิยม + ชิดขวา
- **Integer columns**: คอมม่า + ไม่มีทศนิยม
- **Auto-sizing**: คำนวณความกว้างอัตโนมัติ
- **Dark mode**: รองรับโหมดมืด

### Filter System

- **Smart filtering**: ปิด dropdown สำหรับคอลัมน์เงิน
- **Company/Product filters**: เปิดให้กรองตามบริษัท/สินค้า
- **Date filtering**: กรองตามเดือน
- **Clear all**: ปุ่มล้างฟิลเตอร์ทั้งหมด

### Excel Export

- **Multiple sheets**: ข้อมูลหลังฟิลเตอร์ + ข้อมูลดิบทั้งหมด
- **Column groups**: Header groups พร้อม merge cells
- **Number formatting**: Accounting format สำหรับเงิน
- **Styling**: Header สีเหลือง + bold

## 💡 Best Practices

### 1. ใช้ Auto-formatting ก่อน

ให้ระบบจดจำอัตโนมัติก่อน แล้วค่อย override ในกรณีพิเศษ:

```json
{
  "columnFormatters": {
    // เฉพาะคอลัมน์ที่ระบบจดจำไม่ได้ หรือต้องการฟอร์แมตพิเศษ
    "REVENUE_Q4": "money",
    "CUST_COUNT": "int",
    "MARGIN_PCT": "percent"
  }
}
```

### 2. ตั้งชื่อคอลัมน์ให้ชัดเจน

- ✅ `Total Value`, `Unit Price`, `Sales Amount`
- ❌ `Col1`, `Field_A`, `Data_Value`

### 3. ใช้ Column Groups เพื่อความเป็นระเบียบ

```json
{
  "columnGroups": [
    {
      "title": "📋 Product Info",
      "columns": ["Company", "Product", "Category"]
    },
    {
      "title": "💰 Financial Data",
      "columns": ["Unit Price", "Total Value", "Cost"]
    },
    {
      "title": "📅 Aging Analysis",
      "columns": [
        "0-90 Days: Value",
        "91-180 Days: Value",
        "Over 365 Days: Value"
      ]
    }
  ]
}
```

## 🔧 Technical Implementation

### Utils Function

```typescript
import { formatMoney, isMoneyField } from "../utils/numberFormat";

// ใช้ใน component
const displayValue = isMoneyField(columnName) ? formatMoney(value) : value;
```

### Custom Formatting

```typescript
// ฟอร์แมตเงินแบบกำหนดเอง
formatMoney(1234.567, 2); // "1,234.57"
formatMoney(1234.567, 0); // "1,235"

// ตรวจสอบคอลัมน์เงิน
isMoneyField("Total Value"); // true
isMoneyField("Product Name"); // false
```

## 📊 Sample Data Structure

ตัวอย่างข้อมูลที่ระบบจะฟอร์แมตอัตโนมัติ:

```json
[
  {
    "Company": "บริษัท A",
    "Product": "สินค้า 1",
    "Total Value": 125430.5,
    "0-90 Days: Value": 95430.25,
    "91-180 Days: Value": 20000.0,
    "Over 365 Days: Value": 10000.25,
    "Quantity": 150,
    "Unit Price": 836.2
  }
]
```

ผลลัพธ์หน้าจอ:

- Total Value: **125,430.50** (ชิดขวา)
- 0-90 Days: Value: **95,430.25** (ชิดขวา)
- Quantity: **150** (ไม่มีทศนิยม)
- Unit Price: **836.20** (ชิดขวา)
