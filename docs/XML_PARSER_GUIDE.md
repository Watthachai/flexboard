# XML Parser Test Examples

ระบบ Universal XML Parser รองรับ XML structure หลายรูปแบบ:

## 1. GraphData/Dataset Structure (คล้ายไฟล์ pvs.xml ของคุณ)

```xml
<GraphData>
  <Dataset1>
    <DataDate>2025-06-30</DataDate>
    <Corp>PVI-บริษัท พีวี อินเตอร์เนชั่นแนล เทรดดิ้ง จำกัด</Corp>
    <Branch>00001-สำนักงานใหญ่</Branch>
    <Prod>AE001-วัตถุระเบิด (อีมัลชั่น) 150 - 55 MM x 350 MM</Prod>
    <QtyFromThisDoc>8.0000</QtyFromThisDoc>
  </Dataset1>
  <Dataset1>
    <DataDate>2025-06-30</DataDate>
    <Corp>PVI-บริษัท พีวี อินเตอร์เนชั่นแนล เทรดดิ้ง จำกัด</Corp>
    <Branch>00001-สำนักงานใหญ่</Branch>
    <Prod>PVI-003-แก๊ปไฟฟ้า ชนิด IED (เชื้อปะทุไฟฟ้า) 3 เมตร เบอร์ 0</Prod>
    <QtyFromThisDoc>15130.0000</QtyFromThisDoc>
  </Dataset1>
</GraphData>
```

## 2. Table/Row Structure

```xml
<InventoryData>
  <Table>
    <Row>
      <ProductID>P001</ProductID>
      <ProductName>Laptop Dell</ProductName>
      <Price>25000</Price>
      <Quantity>50</Quantity>
    </Row>
    <Row>
      <ProductID>P002</ProductID>
      <ProductName>Mouse Wireless</ProductName>
      <Price>500</Price>
      <Quantity>100</Quantity>
    </Row>
  </Table>
</InventoryData>
```

## 3. Records/Record Structure

```xml
<SalesData>
  <Records>
    <Record ID="1">
      <Date>2025-01-15</Date>
      <Customer>ABC Company</Customer>
      <Amount>125000</Amount>
      <Status>Completed</Status>
    </Record>
    <Record ID="2">
      <Date>2025-01-16</Date>
      <Customer>XYZ Corp</Customer>
      <Amount>89000</Amount>
      <Status>Pending</Status>
    </Record>
  </Records>
</SalesData>
```

## 4. Items/Item Structure

```xml
<Catalog>
  <Items>
    <Item Code="SKU001" Category="Electronics">
      <Name>Smartphone</Name>
      <Price>15000</Price>
      <InStock>25</InStock>
    </Item>
    <Item Code="SKU002" Category="Accessories">
      <Name>Phone Case</Name>
      <Price>350</Price>
      <InStock>100</InStock>
    </Item>
  </Items>
</Catalog>
```

## 5. Direct Array Structure

```xml
<Products>
  <Product>
    <ID>1</ID>
    <Name>Product Alpha</Name>
    <Category>Hardware</Category>
    <Price>1500</Price>
  </Product>
  <Product>
    <ID>2</ID>
    <Name>Product Beta</Name>
    <Category>Software</Category>
    <Price>2500</Price>
  </Product>
</Products>
```

## 6. Attribute-Based Structure

```xml
<Inventory>
  <Stock>
    <Item ID="I001" Name="Keyboard" Price="800" Qty="45" />
    <Item ID="I002" Name="Monitor" Price="8500" Qty="12" />
    <Item ID="I003" Name="Webcam" Price="2200" Qty="30" />
  </Stock>
</Inventory>
```

## 7. Mixed Structure (Attributes + Elements)

```xml
<OrderData>
  <Orders>
    <Order ID="ORD001" Date="2025-01-15" Status="Shipped">
      <Customer>John Doe</Customer>
      <Total>4500</Total>
      <Items>
        <Item ProductID="P001" Qty="2" UnitPrice="1500" />
        <Item ProductID="P002" Qty="3" UnitPrice="500" />
      </Items>
    </Order>
    <Order ID="ORD002" Date="2025-01-16" Status="Processing">
      <Customer>Jane Smith</Customer>
      <Total>12000</Total>
      <Items>
        <Item ProductID="P003" Qty="1" UnitPrice="12000" />
      </Items>
    </Order>
  </Orders>
</OrderData>
```

## ฟีเจอร์ที่ระบบรองรับ:

### 🔍 **Automatic Structure Detection**

- ตรวจหา XML pattern อัตโนมัติ
- ระบุ root element และ record element
- Support nested structures

### 🏷️ **Field Processing**

- แปลง attributes เป็น fields (เพิ่ม @ prefix)
- Auto-detect numbers และ dates
- Normalize field names (optional)
- Skip empty fields (optional)

### 📊 **Data Extraction**

- Extract records เป็น flat objects
- Support array และ nested data
- Limit records สำหรับ performance
- Generate column list อัตโนมัติ

### 🛠️ **Flexible Options**

```javascript
const parseOptions = {
  maxRecords: 1000, // จำกัดจำนวน records
  skipEmptyFields: true, // ข้าม fields ว่าง
  normalizeFieldNames: true, // แปลง camelCase เป็น snake_case
  explicitArray: false, // Handle arrays ใน xml2js
  ignoreAttrs: false, // รวม attributes หรือไม่
};
```

## การใช้งาน:

1. **อัปโหลด XML** → ระบบจะ detect structure อัตโนมัติ
2. **Parse & Preview** → แสดงข้อมูลในตาราง
3. **Select Columns** → เลือก columns ที่ต้องการใช้
4. **Save Configuration** → บันทึกการตั้งค่าไว้
5. **Create Dashboard** → ใช้ saved columns ในการสร้างกราฟ

ระบบนี้จะทำให้การทำงานกับ XML ไฟล์ต่างๆ ทำได้ง่ายและยืดหยุ่นมากขึ้นครับ! 🚀
