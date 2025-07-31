# 🎯 คู่มือการใช้งานข้อมูลหลัง Upload

## 📊 Dashboard ID: pvs-co-ltd-this-is-real-test

ยินดีด้วยครับ! ข้อมูล XML ของคุณได้ถูก upload สำเร็จแล้ว ตอนนี้คุณมี Dashboard พร้อมใช้งาน

## 🚀 ขั้นตอนการใช้งาน

### 1. เข้าสู่ Visual Dashboard Editor

```
URL: /tenants/pvs-co-ltd/dashboards/pvs-co-ltd-this-is-real-test/builder
```

### 2. การใช้งาน Quick Widgets

เมื่อเข้า Visual Editor แล้ว คุณจะเห็น:

#### A. ปุ่ม "Quick Widgets from Data"

- อยู่ในแถบเครื่องมือด้านบน (สีเขียว)
- แสดงจำนวนแถวข้อมูลที่ upload
- คลิกเพื่อสร้าง Widget อัตโนมัติ

#### B. Data Source Info Panel

- อยู่ใน Sidebar ด้านซ้าย
- แสดงสรุปข้อมูลที่ upload
- มีปุ่ม "Auto Generate Widgets"

### 3. Widget ที่สร้างอัตโนมัติ

#### 🔢 KPI Widgets

- **Total Records**: จำนวนแถวทั้งหมด
- **Total Quantity**: ยอดรวมจำนวน (ถ้ามี column quantity)
- **Total Value**: มูลค่ารวม (ถ้ามี column value/price)

#### 📋 Table Widget

- แสดงข้อมูลดิบในรูปแบบตาราง
- รองรับ pagination
- แสดง 50 แถวแรก

#### 📈 Chart Widget

- สร้างจากข้อมูล string และ numeric columns
- แสดงเป็น Bar Chart
- Group ข้อมูลตาม category แรก

### 4. การปรับแต่ง Widget

#### A. การเลือก Widget

- คลิกที่ Widget เพื่อเลือก
- Properties Panel จะปรากฏด้านขวา

#### B. การแก้ไขข้อมูล

- เปลี่ยนชื่อ Widget
- ปรับแต่งสี และ format
- เปลี่ยน chart type
- กรองข้อมูล (filter)

#### C. การย้ายและปรับขนาด

- ลาก Widget เพื่อย้ายตำแหน่ง
- ลากมุม Widget เพื่อปรับขนาด
- ใช้ Grid system (24x16)

### 5. Advanced Features

#### A. การสร้าง Widget เพิ่มเติม

```typescript
// Manual Widget Creation
// จาก Widget Library ด้านซ้าย:
- KPI: สำหรับตัวเลขสำคัญ
- Chart: กราฟแท่ง, เส้น, วงกลม
- Table: ตารางข้อมูล
- Gauge: มาตรวัด
```

#### B. การใช้ Data Filters

```javascript
// ตัวอย่าง JavaScript filters:
row.quantity > 100;
row.product.includes("PVI");
row.date >= "2025-01-01";
```

#### C. Chart Customization

- **Bar Chart**: เปรียบเทียบ categories
- **Line Chart**: แสดงแนวโน้มตามเวลา
- **Pie Chart**: อัตราส่วน percentage
- **Area Chart**: ข้อมูลสะสม

### 6. การบันทึกและแชร์

#### A. Save Dashboard

- กดปุ่ม "Save" ในแถบเครื่องมือ
- Dashboard จะถูกบันทึกใน Firestore

#### B. Preview Mode

- กดปุ่ม "Preview Mode" เพื่อดูผลลัพธ์จริง
- ซ่อน editing tools
- แสดงผลแบบ end-user

#### C. Share & Export

- ส่งออกเป็น JSON/PDF
- สร้าง public link
- Export image/screenshot

## 🎨 Tips & Best Practices

### 1. Layout Design

```
Grid System: 24 columns × 16 rows
- KPI widgets: 3×2 units
- Charts: 6×6 units
- Tables: 12×6 units
- Headers: 24×1 units
```

### 2. Color Coding

- **Blue**: ข้อมูลทั่วไป (Total, Count)
- **Green**: ข้อมูลเชิงบวก (Revenue, Success)
- **Orange**: ข้อมูลเตือน (Pending, Warning)
- **Red**: ข้อมูลวิกฤต (Error, Alert)

### 3. Performance

- Table widgets: จำกัด 50-100 แถว
- Chart widgets: จำกัด 10-20 categories
- Refresh interval: ≥ 30 วินาที

## 🔧 Troubleshooting

### ปัญหาที่อาจพบ

#### 1. Widget ไม่แสดงข้อมูล

```
สาเหตุ: Column mapping ไม่ถูกต้อง
แก้ไข: ตรวจสอบชื่อ column ใน Properties Panel
```

#### 2. Chart ไม่แสดง

```
สาเหตุ: ข้อมูลไม่ใช่ตัวเลข
แก้ไข: เลือก column ที่เป็น numeric type
```

#### 3. Performance ช้า

```
สาเหตุ: ข้อมูลมากเกินไป
แก้ไข: เพิ่ม filter หรือ limit จำนวนแถว
```

## 📞 Support

หากต้องการความช่วยเหลือ:

1. ตรวจสอบ Console logs (F12)
2. ลองใช้ "Try Again" ใน error message
3. Refresh หน้าแล้วลองใหม่

---

**🎉 ยินดีด้วย! ตอนนี้คุณพร้อมสร้าง Dashboard ที่สวยงามจากข้อมูลที่ upload แล้ว**
