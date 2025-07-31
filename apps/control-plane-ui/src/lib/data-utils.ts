/**
 * ฟังก์ชันสำหรับทำความสะอาดข้อมูลที่อาจถูก serialize ซ้อนกัน
 * ใช้สำหรับแปลงข้อมูล JSON string ที่ซ้อนกันให้เป็น object ปกติ
 */
export const cleanJsonData = (obj: any): any => {
  if (typeof obj === "string") {
    try {
      // ถ้าเป็น string ที่มี JSON ให้ parse
      const parsedString = JSON.parse(obj);
      return cleanJsonData(parsedString); // recursive clean
    } catch {
      return obj; // ถ้า parse ไม่ได้ ให้เก็บเป็น string
    }
  } else if (Array.isArray(obj)) {
    return obj.map((item) => cleanJsonData(item));
  } else if (obj && typeof obj === "object") {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = cleanJsonData(value);
    }
    return cleaned;
  }
  return obj;
};

/**
 * ฟังก์ชันสำหรับดึงข้อมูล dataset จาก metadata ที่ทำความสะอาดแล้ว
 */
export const extractDatasetFromMetadata = (jsonCode: string) => {
  try {
    let parsed = JSON.parse(jsonCode);
    parsed = cleanJsonData(parsed);

    const uploadedData = parsed.dataSourceConfig?.uploadedData;

    if (uploadedData?.dataset?.record) {
      const records = Array.isArray(uploadedData.dataset.record)
        ? uploadedData.dataset.record
        : [uploadedData.dataset.record];

      return {
        records,
        columns: records.length > 0 ? Object.keys(records[0]) : [],
        totalRecords: records.length,
      };
    }

    return {
      records: [],
      columns: [],
      totalRecords: 0,
    };
  } catch (error) {
    console.error("Error extracting dataset:", error);
    return {
      records: [],
      columns: [],
      totalRecords: 0,
    };
  }
};

/**
 * ฟังก์ชันสำหรับตรวจสอบประเภทข้อมูลของ column
 */
export const detectColumnType = (data: any[], columnName: string): string => {
  if (data.length === 0) return "string";

  const samples = data.slice(0, 5).map((record) => record[columnName]);
  const nonNullSamples = samples.filter(
    (val) => val !== null && val !== undefined
  );

  if (nonNullSamples.length === 0) return "string";

  // ตรวจสอบว่าเป็นตัวเลขหรือไม่
  if (
    nonNullSamples.every(
      (val) => typeof val === "number" || !isNaN(Number(val))
    )
  ) {
    return "number";
  }

  // ตรวจสอบว่าเป็นวันที่หรือไม่
  if (nonNullSamples.every((val) => !isNaN(Date.parse(val)))) {
    return "date";
  }

  // ตรวจสอบว่าเป็น boolean หรือไม่
  if (
    nonNullSamples.every(
      (val) =>
        typeof val === "boolean" ||
        ["true", "false", "1", "0", "yes", "no"].includes(
          String(val).toLowerCase()
        )
    )
  ) {
    return "boolean";
  }

  return "string";
};

/**
 * ฟังก์ชันสำหรับจัดรูปแบบค่าข้อมูลให้แสดงผล
 */
export const formatDataValue = (value: any): string => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
};

/**
 * ฟังก์ชันสำหรับคำนวณยอดรวมของ Quantity
 */
export const calculateTotalQuantity = (records: any[]): number => {
  if (!Array.isArray(records) || records.length === 0) return 0;

  let total = 0;
  records.forEach((record) => {
    Object.keys(record).forEach((key) => {
      if (
        key.toLowerCase().includes("qty") ||
        key.toLowerCase().includes("quantity") ||
        key.toLowerCase().includes("qtyfromthisdoc")
      ) {
        const value = parseFloat(record[key]) || 0;
        total += value;
      }
    });
  });

  return total;
};

/**
 * ฟังก์ชันสำหรับคำนวณยอดรวมของ Value/Cost
 */
export const calculateTotalValue = (records: any[]): number => {
  if (!Array.isArray(records) || records.length === 0) return 0;

  let total = 0;
  records.forEach((record) => {
    Object.keys(record).forEach((key) => {
      if (
        key.toLowerCase().includes("cost") ||
        key.toLowerCase().includes("value") ||
        key.toLowerCase().includes("price") ||
        key.toLowerCase().includes("averagecost")
      ) {
        const value = parseFloat(record[key]) || 0;
        total += value;
      }
    });
  });

  return total;
};
