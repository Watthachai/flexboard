# OnPrem Viewer SQL Data Source Setup

## การเชื่อมต่อ SQL Database

OnPrem Viewer รองรับการเชื่อมต่อกับ SQL databases หลายประเภท:

### 1. PostgreSQL

```
Connection String: postgresql://username:password@localhost:5432/database_name
Table Name: your_table_name
```

### 2. MySQL

```
Connection String: mysql://username:password@localhost:3306/database_name
Table Name: your_table_name
```

### 3. SQLite

```
Connection String: sqlite:/path/to/your/database.db
Table Name: your_table_name
```

## ตัวอย่าง SQL Schema

สร้างตารางตัวอย่างสำหรับ dashboard data:

### PostgreSQL/MySQL

```sql
CREATE TABLE sales_data (
    id SERIAL PRIMARY KEY,
    branch VARCHAR(100),
    average_cost DECIMAL(10,2),
    corp VARCHAR(200),
    data_date DATE,
    doc_date DATE,
    doc_number VARCHAR(50),
    product VARCHAR(200),
    qty INTEGER,
    unit_name VARCHAR(50)
);

-- Insert sample data
INSERT INTO sales_data (branch, average_cost, corp, data_date, doc_date, doc_number, product, qty, unit_name) VALUES
('00001-สำนักงานใหญ่', 100.00, 'PVI-บจอน ศรี ขันแก้นกันตินคินน', '2025-06-30', '2024-06-09', 'EXP24-25/7', 'AE001-สิงเสิงอส (อิจฉอด) 15', 8, 'ขิก'),
('00002-สาขาภูเก็ต', 150.00, 'PVI-บจอน ศรี ขันแก้นกันตินคินน', '2025-06-30', '2024-05-19', 'IB 68/0511', 'PVI-003-สดใหม่ ซีก โนกอ EO (1)', 16130, 'ขิก'),
('00003-สาขาเชียงใหม่', 120.00, 'PVI-บจอน ศรี ขันแก้นกันตินคินน', '2025-06-30', '2024-04-15', 'INV-2024-001', 'Product C', 250, 'ชิ้น'),
('00004-สาขาขอนแก่น', 90.00, 'PVI-บจอน ศรี ขันแก้นกันตินคินน', '2025-06-30', '2024-03-20', 'INV-2024-002', 'Product D', 180, 'ชิ้น');
```

### SQLite

```sql
CREATE TABLE sales_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch TEXT,
    average_cost REAL,
    corp TEXT,
    data_date TEXT,
    doc_date TEXT,
    doc_number TEXT,
    product TEXT,
    qty INTEGER,
    unit_name TEXT
);

-- Insert sample data (same as above)
```

## การใช้งานใน OnPrem Viewer

1. **เปิดหน้า Settings**: คลิกปุ่ม "⚙️ Settings" ใน header
2. **เลือกแท็บ Data Sources**
3. **คลิก "Add Data Source"**
4. **กรอกข้อมูล**:
   - **Type**: เลือก "SQL Database"
   - **Name**: ชื่อที่จะแสดงใน UI เช่น "Production Database"
   - **Connection String**: URL การเชื่อมต่อ database
   - **Table Name**: ชื่อตารางหลักที่จะใช้ query
   - **Custom Query**: (ไม่บังคับ) SQL query ที่กำหนดเอง

5. **คลิก "Test"** เพื่อทดสอบการเชื่อมต่อ
6. **คลิก "Add Data Source"** เพื่อบันทึก

## Auto-Generated Queries

เมื่อ widget มีการกำหนด xAxis และ yAxis, ระบบจะสร้าง SQL query อัตโนมัติ:

### Bar/Line Chart

```sql
SELECT
  branch as name,
  AVG(CAST(average_cost AS DECIMAL)) as value,
  COUNT(*) as count
FROM sales_data
WHERE average_cost IS NOT NULL AND branch IS NOT NULL
GROUP BY branch
ORDER BY value DESC
LIMIT 20
```

### Table Widget

```sql
SELECT average_cost, branch, corp, data_date, doc_date
FROM sales_data
LIMIT 100
```

## การทำงานของระบบ

1. **Manifest Sync**: Dashboard configurations ถูก sync จาก Control Plane API
2. **Widget Processing**: แต่ละ widget จะได้รับ query ที่เหมาะสมตาม type และ configuration
3. **Data Fetching**: ระบบจะ execute SQL queries และแปลงผลลัพธ์เป็นรูปแบบที่ widget ต้องการ
4. **Caching**: ข้อมูลจะถูก cache เพื่อลดการ query ที่ไม่จำเป็น

## การแก้ไขปัญหา

### Connection Failed

- ตรวจสอบ connection string
- ตรวจสอบว่า database server รันอยู่
- ตรวจสอบ firewall และ network connectivity
- ตรวจสอบ username/password

### Query Failed

- ตรวจสอบชื่อตารางและ column names
- ตรวจสอบ SQL syntax
- ดู console logs สำหรับ error details

### No Data Displayed

- ตรวจสอบว่า table มีข้อมูล
- ตรวจสอบ widget configuration (xAxis, yAxis)
- ลองใช้ sample data เพื่อทดสอบ widget

## Security Best Practices

1. **ใช้ Database User ที่มี Permission จำกัด**: สร้าง user เฉพาะสำหรับ OnPrem Viewer ที่มีสิทธิ์แค่ SELECT
2. **Connection Encryption**: ใช้ SSL/TLS สำหรับ database connections
3. **Network Security**: จำกัด network access ระหว่าง OnPrem Viewer และ database
4. **Regular Updates**: อัปเดต database drivers และ dependencies เป็นประจำ

## ตัวอย่าง Custom Queries

### Sales Summary by Month

```sql
SELECT
  DATE_TRUNC('month', data_date) as name,
  SUM(average_cost * qty) as value
FROM sales_data
WHERE data_date >= '2024-01-01'
GROUP BY DATE_TRUNC('month', data_date)
ORDER BY name
```

### Top Products

```sql
SELECT
  product as name,
  SUM(qty) as value
FROM sales_data
GROUP BY product
ORDER BY value DESC
LIMIT 10
```
