/**
 * Number and Money Formatting Utilities
 * Centralized formatting functions for consistent display across all tables
 */

export const formatMoney = (value: unknown, digits = 2): string => {
  const num = Number(value);
  if (isNaN(num)) return String(value ?? "");

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(num);
};

export const formatNumber = (value: unknown, digits = 0): string => {
  const num = Number(value);
  if (isNaN(num)) return String(value ?? "");

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(num);
};

export const isMoneyField = (key: string): boolean =>
  /value|amount|total|price|cost|มูลค่า|ราคา|รวม/i.test(key);

export const isNumericField = (key: string): boolean =>
  /qty|quantity|count|number|จำนวน|นับ/i.test(key);

// Money formatter configuration for manifest files
export const MONEY_FORMATTER_CONFIG = {
  kind: "number",
  precision: 2,
  thousandsSep: ",",
  prefix: "",
  suffix: "",
};

export const INT_FORMATTER_CONFIG = {
  kind: "number",
  precision: 0,
  thousandsSep: ",",
};

// Excel number formats
export const EXCEL_MONEY_FORMAT =
  '_(* #,##0.00_);_(* (#,##0.00);_(* "-"??_);_(@_)';
export const EXCEL_NUMBER_FORMAT = "#,##0.00";
export const EXCEL_INT_FORMAT = "#,##0";
