/* eslint-disable @typescript-eslint/no-explicit-any */
import Papa from "papaparse";
import { XMLParser } from "fast-xml-parser";

export async function loadLocalFile(file: File): Promise<any[]> {
  const ext = file.name.toLowerCase().split(".").pop();
  const text = await file.text();

  if (ext === "csv") {
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    return parsed.data as any[];
  }
  if (ext === "json") {
    const j = JSON.parse(text);
    // รองรับทั้ง array หรือ object ที่มี array ข้างใน
    if (Array.isArray(j)) return j;
    const firstArray = Object.values(j).find((v) => Array.isArray(v)) as
      | any[]
      | undefined;
    if (firstArray) return firstArray;
    throw new Error("JSON must contain an array");
  }
  if (ext === "xml") {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
    });
    const xml = parser.parse(text);
    // เดาตำแหน่งตารางจากโครง: หา array ที่ใหญ่ที่สุด
    const arrays: any[][] = [];
    const walk = (obj: any) => {
      if (Array.isArray(obj)) arrays.push(obj);
      else if (obj && typeof obj === "object") Object.values(obj).forEach(walk);
    };
    walk(xml);
    if (!arrays.length) throw new Error("No array found in XML");
    // เลือก array ที่ยาวที่สุดเป็นตาราง
    const table = arrays.sort((a, b) => b.length - a.length)[0];
    return table;
  }
  throw new Error("Unsupported file type");
}
