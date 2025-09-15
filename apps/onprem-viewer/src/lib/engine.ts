/* eslint-disable @typescript-eslint/no-explicit-any */

import dayjs from "dayjs";

// Debug flag
const DEBUG = false; // Enabled temporarily for debugging
const dlog = (...args: any[]) => {
  if (DEBUG) console.log(...args);
};

type Row = Record<string, any>;

interface ReferenceTable {
  type: "inline" | "local";
  key: string;
  valueField: string;
  defaultValue?: any;
  rows?: Row[];
}

interface EngineContext {
  referenceTables?: Record<string, ReferenceTable>;
  settings?: Record<string, any>;
}

// Template variable replacement function
function replaceTemplateVariables(
  expr: string,
  variables: Record<string, string>
): string {
  let result = expr;
  for (const [variable, value] of Object.entries(variables)) {
    // Replace ${variable} patterns
    result = result.replace(new RegExp(`\\$\\{${variable}\\}`, "g"), value);
    // Also support {{variable}} patterns
    result = result.replace(new RegExp(`\\{\\{${variable}\\}\\}`, "g"), value);
  }
  return result;
}

export function coerceTypes(
  rows: Row[],
  fieldTypes?: Record<string, string>,
  dateParsing?: Record<string, string>
) {
  dlog("🔧 coerceTypes called:", {
    rowsLength: rows.length,
    fieldTypes,
    dateParsing,
    firstRowKeys: rows.length > 0 ? Object.keys(rows[0]) : [],
    firstRowSample: rows.length > 0 ? rows[0] : null,
  });

  if (!fieldTypes || rows.length === 0) return rows;

  return rows.map((row, index) => {
    const newRow = { ...row };

    for (const [field, type] of Object.entries(fieldTypes)) {
      if (!(field in newRow)) continue;

      const value = newRow[field];

      // Skip if value is null/undefined
      if (value == null) continue;

      if (type === "date") {
        try {
          // Check if it's a timestamp (number > 1000000000000 = after year 2001)
          if (typeof value === "number" && value > 1000000000000) {
            // Convert timestamp to ISO date string
            newRow[field] = new Date(value).toISOString().split("T")[0];
            if (DEBUG && index < 3) {
              dlog(`🔧 Converted timestamp ${value} to date: ${newRow[field]}`);
            }
          } else if (typeof value === "string") {
            // Try to parse as timestamp first
            const numValue = Number(value);
            if (!isNaN(numValue) && numValue > 1000000000000) {
              newRow[field] = new Date(numValue).toISOString().split("T")[0];
              if (DEBUG && index < 3) {
                dlog(
                  `🔧 Converted string timestamp ${value} to date: ${newRow[field]}`
                );
              }
            } else {
              // Keep as string if it's already a date string
              newRow[field] = value;
            }
          }
        } catch (error) {
          console.warn(`Error converting date field ${field}:`, error);
        }
      } else if (type === "number") {
        newRow[field] = Number(value);
      }
    }

    return newRow;
  });
}

interface CaseCondition {
  condition: (row: any, ctx?: EngineContext) => boolean;
  value: any;
}

interface CompiledTransform {
  field: string;
  type: "computed" | "case" | "dateDiff";
  evaluator?: (row: any, ctx?: EngineContext) => any;
  caseConditions?: CaseCondition[];
  defaultValue?: any;
}

const expressionCache = new Map<
  string,
  (row: any, ctx?: EngineContext) => any
>();

function compileExpression(
  expr: string
): ((row: any, ctx?: EngineContext) => any) | null {
  if (expressionCache.has(expr)) {
    return expressionCache.get(expr)!;
  }

  try {
    // Pre-compile common patterns
    if (expr.includes("dateDiff")) {
      const match = expr.match(
        /dateDiff\(\s*([^,]+),\s*([^,]+),\s*"([^"]+)"\s*\)/
      );
      if (match) {
        const [, field1, field2, unit] = match;
        const compiled = (row: any, ctx?: EngineContext) => {
          const val1 = row[field1.trim()] || Date.now();
          const val2 = row[field2.trim()] || 0;
          return dateDiff(val1, val2, unit as any);
        };
        expressionCache.set(expr, compiled);
        return compiled;
      }
    }

    // For complex expressions, fallback to runtime evaluation
    const compiled = (row: any, ctx?: EngineContext) => {
      const defaultCtx: EngineContext = ctx || {
        referenceTables: {},
        settings: {},
      };
      return evaluateExpression(expr, row, defaultCtx);
    };
    expressionCache.set(expr, compiled);
    return compiled;
  } catch (error) {
    if (DEBUG) console.error(`Failed to compile expression: ${expr}`, error);
    // ไม่ return null แต่ให้ fallback function แทน
    const fallback = (row: any, ctx?: EngineContext) => {
      try {
        const defaultCtx: EngineContext = ctx || {
          referenceTables: {},
          settings: {},
        };
        return evaluateExpression(expr, row, defaultCtx);
      } catch (e) {
        if (DEBUG) console.error(`Fallback expression failed: ${expr}`, e);
        return null;
      }
    };
    expressionCache.set(expr, fallback);
    return fallback;
  }
}

const transformCache = new Map<string, CompiledTransform>();

function compileTransform(transform: any): CompiledTransform {
  const cacheKey = JSON.stringify(transform);
  if (transformCache.has(cacheKey)) {
    return transformCache.get(cacheKey)!;
  }

  let compiled: CompiledTransform;

  if (transform.field && transform.expression) {
    if (transform.expression.includes("dateDiff")) {
      // Parse dateDiff expression - format: dateDiff(field1, field2, "unit")
      const match = transform.expression.match(
        /dateDiff\(\s*([^,]+),\s*([^,]+),\s*"([^"]+)"\s*\)/
      );
      if (match) {
        const [, field1, field2, unit] = match;
        compiled = {
          field: transform.field,
          type: "dateDiff",
          evaluator: (row: any) => {
            const val1 = row[field1.trim()] || Date.now();
            const val2 = row[field2.trim()] || 0;
            return dateDiff(val1, val2, unit as any);
          },
        };
      } else {
        compiled = {
          field: transform.field,
          type: "computed",
          evaluator: (row: any, ctx?: EngineContext) => {
            const defaultCtx: EngineContext = ctx || {
              referenceTables: {},
              settings: {},
            };
            return evaluateExpression(transform.expression, row, defaultCtx);
          },
        };
      }
    } else {
      compiled = {
        field: transform.field,
        type: "computed",
        evaluator: (row: any, ctx?: EngineContext) => {
          const defaultCtx: EngineContext = ctx || {
            referenceTables: {},
            settings: {},
          };
          return evaluateExpression(transform.expression, row, defaultCtx);
        },
      };
    }
  } else if (transform.field && transform.case) {
    const caseConditions: CaseCondition[] = [];
    for (const caseItem of transform.case) {
      const condition = (row: any, ctx?: EngineContext) => {
        const defaultCtx: EngineContext = ctx || {
          referenceTables: {},
          settings: {},
        };
        return evaluateExpression(caseItem.when, row, defaultCtx);
      };
      caseConditions.push({
        condition,
        value: caseItem.then,
      });
    }

    compiled = {
      field: transform.field,
      type: "case",
      caseConditions,
      defaultValue: transform.default || null,
    };
  } else {
    compiled = {
      field: transform.field,
      type: "computed",
      evaluator: (row: any) => null,
    };
  }

  transformCache.set(cacheKey, compiled);
  return compiled;
}

function applyCompiledTransform(
  row: any,
  compiled: CompiledTransform,
  ctx?: EngineContext
): any {
  try {
    const defaultCtx: EngineContext = ctx || {
      referenceTables: {},
      settings: {},
    };

    if (compiled.type === "case" && compiled.caseConditions) {
      for (const caseCondition of compiled.caseConditions) {
        if (caseCondition.condition(row, defaultCtx)) {
          return caseCondition.value;
        }
      }
      return compiled.defaultValue;
    } else if (compiled.evaluator) {
      return compiled.evaluator(row, defaultCtx);
    }
    return null;
  } catch (error) {
    if (DEBUG)
      console.error(`Transform error for field ${compiled.field}:`, error);
    return null;
  }
}

// --- Helper functions for expression evaluation ---
function iif(condition: any, trueValue: any, falseValue: any = 0): any {
  return condition ? trueValue : falseValue;
}

function dateDiffEpoch(
  aMs: number,
  bMs: number,
  unit: "days" | "months" | "years"
) {
  const diffMs = aMs - bMs;
  if (unit === "days") return Math.floor(diffMs / 86400000);
  if (unit === "months") return Math.floor(diffMs / 2629800000); // ~30.44d
  if (unit === "years") return Math.floor(diffMs / 31557600000); // ~365.25d
  return 0;
}

function dateDiff(a: any, b: any, unit: "days" | "months" | "years") {
  dlog("🔢 dateDiff called:", {
    a,
    b,
    unit,
    aType: typeof a,
    bType: typeof b,
  });

  if (a == null || b == null) {
    dlog("🔢 dateDiff: null values detected, returning 0");
    return 0;
  }

  // If already epoch numbers, use fast calculation
  if (typeof a === "number" && typeof b === "number") {
    const result = dateDiffEpoch(a, b, unit);
    dlog("🔢 dateDiff result (fast):", result);
    return result;
  }

  // Fallback to dayjs for non-numeric values
  const result = dayjs(a).diff(dayjs(b), unit);
  dlog("🔢 dateDiff result (dayjs):", {
    result,
    aFormatted: dayjs(a).format("YYYY-MM-DD"),
    bFormatted: dayjs(b).format("YYYY-MM-DD"),
    aValid: dayjs(a).isValid(),
    bValid: dayjs(b).isValid(),
  });
  return result;
}

function addDays(a: any, days: number) {
  return dayjs(a).add(days, "day");
}

function addMonths(a: any, months: number) {
  return dayjs(a).add(months, "month");
}

function formatDate(a: any, format: string) {
  return dayjs(a).format(format);
}

function today() {
  return dayjs().toDate();
}

function endOfMonth(a: any) {
  return dayjs(a).endOf("month").toDate();
}

function generateMonthEndDates() {
  const dates = [];
  const now = dayjs();

  // เดือนปัจจุบัน
  dates.push({
    value: now.endOf("month").format("YYYY-MM-DD"),
    label: now.format("MMMM YYYY") + " (ปัจจุบัน)",
    monthIndex: 0,
  });

  // 6 เดือนย้อนหลัง
  for (let i = 1; i <= 6; i++) {
    const monthDate = now.subtract(i, "month");
    dates.push({
      value: monthDate.endOf("month").format("YYYY-MM-DD"),
      label: monthDate.format("MMMM YYYY"),
      monthIndex: i,
    });
  }

  return dates;
}

function getMonthEndDatesValues() {
  return generateMonthEndDates().map((d) => d.value);
}

export { generateMonthEndDates, getMonthEndDatesValues };

function parseCaseArguments(argsString: string): string[] {
  const args: string[] = [];
  let current = "";
  let inQuotes = false;
  let quoteChar = "";
  let parenLevel = 0;

  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i];

    if (!inQuotes) {
      if (char === "'" || char === '"') {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === "(") {
        parenLevel++;
        current += char;
      } else if (char === ")") {
        parenLevel--;
        current += char;
      } else if (char === "," && parenLevel === 0) {
        args.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    } else {
      current += char;
      if (char === quoteChar) {
        inQuotes = false;
        quoteChar = "";
      }
    }
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

function lookupDs(
  tableName: string,
  keyField: string,
  valueField: string,
  context: EngineContext,
  row: Row
): any {
  const table = context.referenceTables?.[tableName];
  if (!table || !table.rows) {
    return table?.defaultValue ?? null;
  }

  const keyValue = row[keyField];
  const found = table.rows.find((r) => r[table.key] === keyValue);
  return found ? found[valueField] : table.defaultValue ?? null;
}

function coalesce(...values: any[]): any {
  return values.find((v) => v != null) ?? null;
}

// Enhanced expression parser
function evaluateExpression(
  expr: string,
  row: Row,
  context: EngineContext
): any {
  try {
    // Handle case expression: case( condition1, value1, condition2, value2, true, defaultValue )
    const caseMatch = expr.match(/case\s*\(\s*(.*)\s*\)/);
    if (caseMatch) {
      // Better argument parsing that handles quoted strings
      const args = parseCaseArguments(caseMatch[1]);
      dlog("case expression args:", args);

      // Process pairs of condition, value
      for (let i = 0; i < args.length - 1; i += 2) {
        const condition = args[i];
        const value = args[i + 1];

        dlog(`evaluating case condition: "${condition}" for value: "${value}"`);

        // Special case for 'true' condition (default case)
        if (condition === "true") {
          // Default branch: evaluate value so numbers/fields resolve, strip quotes if any
          const evaluatedDefault = evaluateValue(value, row, context);
          dlog("case default value:", evaluatedDefault);
          return evaluatedDefault;
        }

        // Evaluate the condition
        const conditionResult = evaluateCondition(condition, row, context);
        dlog(
          "case condition result:",
          conditionResult,
          "for condition:",
          condition
        );

        if (conditionResult) {
          const evaluatedValue = evaluateValue(value, row, context);
          dlog("case matched! returning value:", evaluatedValue);
          return evaluatedValue;
        }
      }

      dlog("case: no condition matched, returning null");
      return null; // No condition matched
    }

    // Handle formatDate
    const formatDateMatch = expr.match(/formatDate\(([^,]+),\s*'([^']+)'\)/);
    if (formatDateMatch) {
      const dateValue = row[formatDateMatch[1].trim()];
      const format = formatDateMatch[2];
      return formatDate(dateValue, format);
    }

    // Handle coalesce with lookupDs
    const coalesceMatch = expr.match(/coalesce\((.*)\)/);
    if (coalesceMatch) {
      const args = coalesceMatch[1].split(",").map((arg) => {
        const trimmed = arg.trim();

        // Check if it's a lookupDs call
        const lookupMatch = trimmed.match(
          /lookupDs\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/
        );
        if (lookupMatch) {
          const [, tableName, keyField, valueField] = lookupMatch;
          return lookupDs(tableName, keyField, valueField, context, row);
        }

        // Check if it's a number
        const numMatch = trimmed.match(/^\d+$/);
        if (numMatch) {
          return Number(trimmed);
        }

        // Otherwise treat as field reference
        return row[trimmed];
      });

      return coalesce(...args);
    }

    // Handle addDays
    const addDaysMatch = expr.match(/addDays\(([^,]+),\s*([^)]+)\)/);
    if (addDaysMatch) {
      const dateValue = row[addDaysMatch[1].trim()];
      const daysValue = evaluateExpression(
        addDaysMatch[2].trim(),
        row,
        context
      );
      return addDays(dateValue, Number(daysValue));
    }

    // Handle addMonths
    const addMonthsMatch = expr.match(/addMonths\(([^,]+),\s*([^)]+)\)/);
    if (addMonthsMatch) {
      const dateExpr = addMonthsMatch[1].trim();
      const monthsValue = evaluateExpression(
        addMonthsMatch[2].trim(),
        row,
        context
      );

      // Handle nested expressions like endOfMonth(today())
      const dateValue = evaluateExpression(dateExpr, row, context);
      return addMonths(dateValue, Number(monthsValue));
    }

    // Handle endOfMonth
    const endOfMonthMatch = expr.match(/endOfMonth\(([^)]+)\)/);
    if (endOfMonthMatch) {
      const dateExpr = endOfMonthMatch[1].trim();
      // Handle nested expressions like today()
      const dateValue = evaluateExpression(dateExpr, row, context);
      return endOfMonth(dateValue);
    }

    // Handle today
    if (expr.trim() === "today()") {
      return today();
    }

    // Handle generateMonthEndDates
    if (expr.trim() === "generateMonthEndDates()") {
      return generateMonthEndDates();
    }

    // Handle dateDiff
    const dateDiffMatch = expr.match(
      /dateDiff\(([^,]+),\s*([^,]+),\s*'([^']+)'\)/
    );
    if (dateDiffMatch) {
      const dateA = row[dateDiffMatch[1].trim()];
      const dateB = row[dateDiffMatch[2].trim()];
      const unit = dateDiffMatch[3] as "days" | "months" | "years";
      dlog("🔍 dateDiff match found:", {
        expr,
        field1: dateDiffMatch[1].trim(),
        field2: dateDiffMatch[2].trim(),
        dateA,
        dateB,
        unit,
        rowKeys: Object.keys(row),
      });
      return dateDiff(dateA, dateB, unit);
    }

    // Handle iif conditions
    const iifMatch = expr.match(/iif\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
    if (iifMatch) {
      const condition = evaluateCondition(iifMatch[1].trim(), row, context);
      const trueValue = evaluateValue(iifMatch[2].trim(), row, context);
      const falseValue = evaluateValue(iifMatch[3].trim(), row, context);
      return iif(condition, trueValue, falseValue);
    }

    // Handle simple arithmetic
    if (expr.includes(" * ")) {
      const [left, right] = expr.split(" * ").map((s) => s.trim());
      return Number(row[left]) * Number(row[right]);
    }

    // Default: return field value
    return row[expr];
  } catch (error) {
    console.warn(`Error evaluating expression "${expr}":`, error);
    return null;
  }
}

function evaluateCondition(
  condExpr: string,
  row: Row,
  context: EngineContext
): boolean {
  try {
    dlog(`evaluateCondition: "${condExpr}"`);

    // Handle settings references
    if (condExpr.includes("settings.")) {
      const settingsMatch = condExpr.match(
        /([^<>=!&|]+)\s*([<>=!]+)\s*settings\.([a-zA-Z_][a-zA-Z0-9_]*)/
      );
      if (settingsMatch) {
        const leftValue = evaluateValue(settingsMatch[1].trim(), row, context);
        const operator = settingsMatch[2].trim();
        const settingValue = context.settings?.[settingsMatch[3]];

        dlog(`settings comparison: ${leftValue} ${operator} ${settingValue}`);

        switch (operator) {
          case "<=":
            return Number(leftValue) <= Number(settingValue);
          case ">=":
            return Number(leftValue) >= Number(settingValue);
          case "<":
            return Number(leftValue) < Number(settingValue);
          case ">":
            return Number(leftValue) > Number(settingValue);
          case "==":
            return leftValue == settingValue;
          case "!=":
            return leftValue != settingValue;
        }
      }
    }

    // Handle compound conditions with &&
    if (condExpr.includes(" && ")) {
      const parts = condExpr.split(" && ");
      return parts.every((part) =>
        evaluateCondition(part.trim(), row, context)
      );
    }

    // Handle simple comparisons
    const comparisonMatch = condExpr.match(
      /([^<>=!]+)\s*([<>=!]+)\s*([^<>=!]+)/
    );
    if (comparisonMatch) {
      const leftValue = evaluateValue(comparisonMatch[1].trim(), row, context);
      const operator = comparisonMatch[2].trim();
      const rightValue = evaluateValue(comparisonMatch[3].trim(), row, context);

      dlog(`comparison: ${leftValue} ${operator} ${rightValue}`);

      // Normalize string values to prevent space/trim issues
      const norm = (v: any) => (typeof v === "string" ? v.trim() : v);
      const L = norm(leftValue);
      const R = norm(rightValue);

      switch (operator) {
        case "<=":
          return Number(L) <= Number(R);
        case ">=":
          return Number(L) >= Number(R);
        case "<":
          return Number(L) < Number(R);
        case ">":
          return Number(L) > Number(R);
        case "=":
          // Support single equals as equality for DSL convenience
          return L == R;
        case "==":
          return L == R;
        case "!=":
          return L != R;
      }
    }

    dlog(`condition evaluation failed for: "${condExpr}"`);
    return false;
  } catch (error) {
    console.warn(`Error evaluating condition "${condExpr}":`, error);
    return false;
  }
}

function evaluateValue(
  valueExpr: string,
  row: Row,
  context: EngineContext
): any {
  const trimmed = valueExpr.trim();
  dlog(`evaluateValue: "${trimmed}"`);

  // Handle quoted string literals ('text' or "text")
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length > 1) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 1)
  ) {
    const result = trimmed.slice(1, -1);
    dlog(`evaluateValue quoted string: "${result}"`);
    return result;
  }

  // Handle numbers
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    dlog(`evaluateValue number: ${Number(trimmed)}`);
    return Number(trimmed);
  }

  // Handle field references
  if (row.hasOwnProperty(trimmed)) {
    dlog(`evaluateValue field "${trimmed}": ${row[trimmed]}`);
    return row[trimmed];
  }

  // Default return as is
  dlog(`evaluateValue default: "${trimmed}"`);
  return trimmed;
}

export function applyTransforms(
  rows: Row[],
  transforms?: { as: string; expr: string }[],
  context?: EngineContext
) {
  dlog("🔄 applyTransforms called:", {
    rowsLength: rows.length,
    transformsLength: transforms?.length || 0,
    transforms: transforms,
    firstRowKeys: rows.length > 0 ? Object.keys(rows[0]) : [],
  });

  if (!transforms?.length) {
    dlog("⚠️ No transforms to apply");
    return rows;
  }

  // Pre-compile all transforms
  const compiledTransforms = transforms.map((t) => ({
    as: t.as,
    compiledExpr: compileExpression(t.expr),
  }));

  const ctx = context || { referenceTables: {}, settings: {} };

  const result = rows.map((r, index) => {
    // Field mapping now handled at API level for better performance
    const rr = { ...r };

    if (DEBUG && index < 2) {
      dlog(`🔄 Processing row ${index}:`, {
        availableKeys: Object.keys(r),
        sampleData: {
          DataDate: r.DataDate,
          DocDate: r.DocDate,
          DocNumber: r.DocNumber,
          QtyFromThisDoc: r.QtyFromThisDoc,
        },
      });
    }

    for (const t of compiledTransforms) {
      const value = t.compiledExpr ? t.compiledExpr(rr, ctx) : null;
      rr[t.as] = value;
      if (DEBUG && index < 2) {
        dlog(`🔧 Transform result: ${t.as} = ${value}`);
      }
    }

    if (DEBUG && index < 2) {
      dlog(`🔄 Row ${index} after transforms:`, {
        newKeys: Object.keys(rr),
        DaysAge: rr.DaysAge,
        AgeBucket: rr.AgeBucket,
        DataDate: rr.DataDate,
        DocDate: rr.DocDate,
        QtySafe: rr.QtySafe,
        TotalValueRow: rr.TotalValueRow,
      });
    }

    return rr;
  });

  dlog("✅ applyTransforms completed:", {
    resultLength: result.length,
    firstResultKeys: result.length > 0 ? Object.keys(result[0]) : [],
  });

  return result;
}

export function filterRows(
  rows: Row[],
  filters?: any[],
  context?: EngineContext
) {
  if (!filters?.length) return rows;

  const ctx = context || { referenceTables: {}, settings: {} };

  return rows.filter((r) => {
    return filters.every((f) => {
      const v = r[f.field];

      // Evaluate value if it's an expression
      let filterValue = f.value;
      if (typeof filterValue === "string" && filterValue.includes("()")) {
        filterValue = evaluateExpression(filterValue, r, ctx);
      }

      if (f.op === "=") return v === filterValue;
      if (f.op === "<") return v < filterValue;
      if (f.op === ">") return v > filterValue;
      if (f.op === "<=") return v <= filterValue;
      if (f.op === ">=") return v >= filterValue;
      if (f.op === "in") {
        if (Array.isArray(filterValue)) {
          return filterValue.includes(v);
        }
        return false;
      }
      return true;
    });
  });
}

export function groupAgg(
  rows: Row[],
  dimensions: string[] | undefined,
  measures: any[]
) {
  // RECOMMENDED TABLE MEASURES FIX:
  // Instead of using pre-computed *_row fields, use expr with conditional aggregation
  // Example for aging buckets:
  // {
  //   "groupBy": ["Prod", "UnitName"],
  //   "measures": [
  //     { "expr": "sum(iif(AgeBucket='0-90', QtyFromThisDoc, 0))", "agg": "sum", "as": "Qty_0_90" },
  //     { "expr": "sum(iif(AgeBucket='0-90', TotalValueRow, 0))", "agg": "sum", "as": "Val_0_90" },
  //     { "expr": "sum(iif(AgeBucket='91-180', QtyFromThisDoc, 0))", "agg": "sum", "as": "Qty_91_180" },
  //     { "expr": "sum(iif(AgeBucket='91-180', TotalValueRow, 0))", "agg": "sum", "as": "Val_91_180" },
  //     { "expr": "sum(iif(AgeBucket='181-365', QtyFromThisDoc, 0))", "agg": "sum", "as": "Qty_181_365" },
  //     { "expr": "sum(iif(AgeBucket='181-365', TotalValueRow, 0))", "agg": "sum", "as": "Val_181_365" },
  //     { "expr": "sum(iif(AgeBucket='>365', QtyFromThisDoc, 0))", "agg": "sum", "as": "Qty_365_plus" },
  //     { "expr": "sum(iif(AgeBucket='>365', TotalValueRow, 0))", "agg": "sum", "as": "Val_365_plus" },
  //     { "field": "TotalValueRow", "agg": "sum", "as": "TotalValue" },
  //     { "field": "QtyFromThisDoc", "agg": "sum", "as": "TotalQty" }
  //   ]
  // }
  // This ensures KPI and Table use the same logic and match exactly.

  // Debug logging disabled for performance
  // console.log("🔍 SUMMARY TABLE AGGREGATION START:", {
  //   rowsCount: rows.length,
  //   dimensions,
  //   measures: measures?.map((m) => ({
  //     field: m.field,
  //     expr: m.expr,
  //     agg: m.agg,
  //     as: m.as,
  //   })),
  //   firstRowKeys: rows.length > 0 ? Object.keys(rows[0]) : [],
  //   firstRowSample: rows.length > 0 ? rows[0] : null,
  //   hasTransformedFields:
  //     rows.length > 0
  //       ? {
  //           hasQty0_90: "Qty_0_90_row" in rows[0],
  //           hasQty91_180: "Qty_91_180_row" in rows[0],
  //           hasQty181_365: "Qty_181_365_row" in rows[0],
  //           hasQty365Plus: "Qty_365_plus_row" in rows[0],
  //           hasAgeBucket: "AgeBucket" in rows[0],
  //           hasDaysAge: "DaysAge" in rows[0],
  //         }
  //       : null,
  // });

  if (!measures?.length) return [];

  if (!dimensions?.length) {
    return [aggBucket({}, rows, measures)];
  }

  // Single-pass optimized grouping with pre-calculated aggregation state
  const buckets = new Map<
    string,
    {
      keys: string[];
      base: Row;
      counts: number[];
      sums: number[];
      mins: number[];
      maxs: number[];
      distinctSets: Set<any>[];
    }
  >();

  // Pre-calculate measure indices for performance
  const measureIndices = measures.map((m, idx) => ({
    idx,
    field: m.field,
    expr: m.expr, // Support expressions
    as: m.as || (m.field ? `${m.agg}_${m.field}` : `expr_${idx}`),
    agg: m.agg,
  }));

  // Single pass through data
  for (const r of rows) {
    const keys = dimensions.map((d) => String(r[d]));
    const keyStr = keys.join("¬");

    let bucket = buckets.get(keyStr);
    if (!bucket) {
      const base: Row = {};
      dimensions.forEach((d, i) => (base[d] = keys[i]));

      bucket = {
        keys,
        base,
        counts: new Array(measureIndices.length).fill(0),
        sums: new Array(measureIndices.length).fill(0),
        mins: new Array(measureIndices.length).fill(Infinity),
        maxs: new Array(measureIndices.length).fill(-Infinity),
        distinctSets: measureIndices.map(() => new Set()),
      };
      buckets.set(keyStr, bucket);
    }

    // Update aggregations in single pass
    for (const { idx, field, expr, agg } of measureIndices) {
      let value: number;

      if (expr) {
        // Handle expressions like sum(iif(AgeBucket='0-90', QtyFromThisDoc, 0))
        if (expr.startsWith("sum(iif(")) {
          // Extract the iif condition and evaluate it for this row
          const iifMatch = expr.match(
            /sum\(iif\(([^,]+),\s*([^,]+),\s*([^)]+)\)\)/
          );
          if (iifMatch) {
            const condition = iifMatch[1].trim();
            const trueValue = iifMatch[2].trim();
            const falseValue = iifMatch[3].trim();

            // Debug logging disabled for performance
            // console.log("🔍 IIF EXPRESSION DEBUG:", {
            //   expr,
            //   condition,
            //   trueValue,
            //   falseValue,
            //   rowSample: {
            //     AgeBucket: r["AgeBucket"],
            //     QtyFromThisDoc: r["QtyFromThisDoc"],
            //     Qty_0_90_row: r["Qty_0_90_row"],
            //   },
            //   availableFields: Object.keys(r).filter(
            //     (k) => k.startsWith("Qty_") || k.includes("Age")
            //   ),
            // });

            // Evaluate condition (e.g., AgeBucket='0-90')
            const conditionResult = evaluateCondition(condition, r, {
              referenceTables: {},
              settings: {},
            });

            // Debug logging disabled for performance
            // console.log("🔍 CONDITION RESULT:", {
            //   condition,
            //   result: conditionResult,
            // });

            if (conditionResult) {
              value = Number(r[trueValue] || 0);
            } else {
              value = Number(falseValue || 0);
            }
          } else {
            value = 0;
          }
        } else {
          // Handle other expressions
          const exprResult = evaluateExpression(expr, r, {
            referenceTables: {},
            settings: {},
          });
          value = Number(exprResult || 0);
        }
      } else {
        value = Number(r[field] || 0);
        // Debug logging disabled for performance
        // console.log("🔍 FIELD VALUE:", {
        //   field,
        //   value,
        //   rowFieldValue: r[field],
        // });
      }

      bucket.counts[idx]++;
      bucket.sums[idx] += value;
      bucket.mins[idx] = Math.min(bucket.mins[idx], value);
      bucket.maxs[idx] = Math.max(bucket.maxs[idx], value);
      if (agg === "countDistinct") {
        bucket.distinctSets[idx].add(expr ? value : r[field]);
      }
    }
  }

  // Convert buckets to final result
  const out: Row[] = [];
  for (const bucket of buckets.values()) {
    const row: Row = { ...bucket.base };

    for (const { idx, as, agg } of measureIndices) {
      if (agg === "sum") {
        row[as] = bucket.sums[idx];
      } else if (agg === "count") {
        row[as] = bucket.counts[idx];
      } else if (agg === "countDistinct") {
        row[as] = bucket.distinctSets[idx].size;
      } else if (agg === "min") {
        row[as] = bucket.mins[idx] === Infinity ? 0 : bucket.mins[idx];
      } else if (agg === "max") {
        row[as] = bucket.maxs[idx] === -Infinity ? 0 : bucket.maxs[idx];
      } else if (agg === "avg") {
        row[as] = bucket.counts[idx]
          ? bucket.sums[idx] / bucket.counts[idx]
          : 0;
      }
    }

    out.push(row);
  }

  // Debug logging disabled for performance
  // console.log("🔍 SUMMARY TABLE AGGREGATION RESULT:", {
  //   resultCount: out.length,
  //   resultSample: out.slice(0, 3),
  //   allResults: out,
  // });

  return out;
}

function aggBucket(base: Row, arr: Row[], measures: any[]) {
  const row: Row = { ...base };
  for (const m of measures) {
    const field = m.field,
      as = m.as || `${m.agg}_${field}`;
    if (m.agg === "sum") {
      row[as] = arr.reduce((s, r) => s + Number(r[field] ?? 0), 0);
    } else if (m.agg === "count") {
      row[as] = arr.length;
    } else if (m.agg === "countDistinct") {
      const set = new Set(arr.map((r) => r[field]));
      row[as] = set.size;
    } else if (m.agg === "min") {
      row[as] = Math.min(...arr.map((r) => Number(r[field])));
    } else if (m.agg === "avg") {
      const s = arr.reduce((s, r) => s + Number(r[field] ?? 0), 0);
      row[as] = arr.length ? s / arr.length : 0;
    }
  }
  return row;
}

export function sortLimit(
  rows: Row[],
  sort?: { field: string; dir: "asc" | "desc" }[],
  limit?: number
) {
  let r = [...rows];
  if (sort?.length) {
    r.sort((a, b) => {
      for (const s of sort) {
        const av = a[s.field],
          bv = b[s.field];
        if (av < bv) return s.dir === "asc" ? -1 : 1;
        if (av > bv) return s.dir === "asc" ? 1 : -1;
      }
      return 0;
    });
  }
  return typeof limit === "number" ? r.slice(0, limit) : r;
}

// Main processing function with full context support
export function processDataWithManifest(
  rows: Row[],
  manifest: {
    referenceTables?: Record<string, ReferenceTable>;
    settings?: Record<string, any>;
    variables?: Record<string, string>; // Template variables for field names
    transforms?: { as: string; expr: string }[];
    globalFilters?: Array<{
      field: string;
      op: string;
      value: unknown;
      description?: string;
    }>;
    dataSources?: Array<{
      id: string;
      fieldTypes?: Record<string, string>;
      dateParsing?: Record<string, string>;
      fieldMapping?: Record<string, string>; // Map standard field names to actual column names
    }>;
  },
  dataSourceId: string = "uploaded-xml"
) {
  dlog("🏭 processDataWithManifest called:", {
    rowsLength: rows.length,
    dataSourceId,
    manifestKeys: Object.keys(manifest || {}),
    hasTransforms: !!(manifest && manifest.transforms),
    transformsLength: manifest?.transforms?.length || 0,
    transforms: manifest?.transforms,
    settings: manifest?.settings,
    globalFilters: manifest?.globalFilters,
  });

  // 1. Find data source config
  const dataSource = manifest.dataSources?.find((ds) => ds.id === dataSourceId);
  dlog("🏭 Data source config:", dataSource);

  // 2. Apply type coercion
  let processedData = coerceTypes(
    rows,
    dataSource?.fieldTypes,
    dataSource?.dateParsing
  );
  dlog("🏭 After type coercion:", {
    length: processedData.length,
    firstRowKeys: processedData.length > 0 ? Object.keys(processedData[0]) : [],
    firstRowSample: processedData.length > 0 ? processedData[0] : null,
  });

  // 2.5. Apply field mapping (rename columns to standard names)
  if (dataSource?.fieldMapping) {
    processedData = processedData.map((row) => {
      const mappedRow = { ...row };
      for (const [standardField, actualField] of Object.entries(
        dataSource.fieldMapping as Record<string, string>
      )) {
        if (actualField in row) {
          mappedRow[standardField] = row[actualField as string];
          // Optional: remove original field
          // delete mappedRow[actualField];
        }
      }
      return mappedRow;
    });
    dlog("🏭 After field mapping:", {
      mapping: dataSource.fieldMapping,
      firstRowKeys:
        processedData.length > 0 ? Object.keys(processedData[0]) : [],
    });
  }

  // 2.7. Apply template variable replacement
  let finalTransforms = manifest.transforms;
  if (manifest.variables && manifest.transforms) {
    finalTransforms = manifest.transforms.map((transform) => ({
      ...transform,
      expr: replaceTemplateVariables(transform.expr, manifest.variables!),
    }));
    dlog("🏭 After template variable replacement:", {
      variables: manifest.variables,
      originalTransforms: manifest.transforms.map((t) => t.expr),
      replacedTransforms: finalTransforms.map((t) => t.expr),
    });
  }

  // 3. Apply transforms with context
  const context: EngineContext = {
    referenceTables: manifest.referenceTables || {},
    settings: manifest.settings || {},
  };

  dlog("🏭 About to call applyTransforms with:", {
    transforms: manifest.transforms,
    context,
  });

  processedData = applyTransforms(processedData, manifest.transforms, context);

  // 4. Apply global filters if specified
  if (manifest.globalFilters && manifest.globalFilters.length > 0) {
    dlog("🏭 Applying global filters:", manifest.globalFilters);
    const beforeGlobalFilter = processedData.length;
    processedData = filterRows(processedData, manifest.globalFilters, context);
    dlog("🏭 After global filters:", {
      beforeGlobalFilter,
      afterGlobalFilter: processedData.length,
      filtered: beforeGlobalFilter - processedData.length,
    });
  }

  dlog("🏭 processDataWithManifest completed:", {
    resultLength: processedData.length,
    resultKeys: processedData.length > 0 ? Object.keys(processedData[0]) : [],
  });

  return processedData;
}
