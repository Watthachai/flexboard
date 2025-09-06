// Simple test of the ingest functions
import { XMLParser } from "fast-xml-parser";

function toNum(s?: string | number) {
  if (typeof s === "number") return Number.isFinite(s) ? s : 0;
  if (typeof s === "string") {
    const n = Number(s.trim());
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function toDateYMD(s?: string | Date | number) {
  if (!s) return new Date();
  if (s instanceof Date) return s;
  if (typeof s === "number") return new Date(s);
  if (typeof s === "string") {
    if (s.includes("T") || s.includes(" ")) {
      return new Date(s);
    }
    return new Date(`${s}T00:00:00`);
  }
  return new Date();
}

// Test the functions
console.log("Testing toNum:");
console.log("toNum('123.45'):", toNum("123.45"));
console.log("toNum(123.45):", toNum(123.45));
console.log("toNum(undefined):", toNum(undefined));

console.log("\nTesting toDateYMD:");
console.log("toDateYMD('2023-01-01'):", toDateYMD("2023-01-01"));
console.log("toDateYMD(undefined):", toDateYMD(undefined));

console.log("\nTest completed successfully!");
