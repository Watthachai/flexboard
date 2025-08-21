import dayjs from "dayjs";

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

export function coerceTypes(
  rows: Row[],
  fieldTypes?: Record<string, string>,
  dateParsing?: Record<string, string>
) {
  return rows.map((r) => {
    const rr: Row = { ...r };
    if (fieldTypes) {
      for (const [k, t] of Object.entries(fieldTypes)) {
        if (rr[k] == null) continue;
        if (t === "number") rr[k] = Number(rr[k]);
        if (t === "date") {
          const fmt = dateParsing?.[k];
          rr[k] = fmt ? dayjs(String(rr[k])) : dayjs(String(rr[k])); // สมมุติ ISO/yyyy-MM-dd
        }
      }
    }
    return rr;
  });
}

// --- Helper functions for expression evaluation ---
function dateDiff(a: any, b: any, unit: "days" | "months" | "years") {
  console.log("🔢 dateDiff called:", {
    a,
    b,
    unit,
    aType: typeof a,
    bType: typeof b,
  });
  const result = dayjs(a).diff(dayjs(b), unit);
  console.log("🔢 dateDiff result:", result);
  return result;
}

function addDays(a: any, days: number) {
  return dayjs(a).add(days, "day");
}

function formatDate(a: any, format: string) {
  return dayjs(a).format(format);
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
  return found ? found[valueField] : (table.defaultValue ?? null);
}

function coalesce(...values: any[]): any {
  return values.find((v) => v != null) ?? null;
}

function iif(condition: boolean, trueValue: any, falseValue: any): any {
  return condition ? trueValue : falseValue;
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
      const args = caseMatch[1].split(",").map((s) => s.trim());
      console.log("case expression args:", args);

      // Process pairs of condition, value
      for (let i = 0; i < args.length - 1; i += 2) {
        const condition = args[i];
        const value = args[i + 1];

        console.log(`evaluating case condition: "${condition}"`);

        // Special case for 'true' condition (default case)
        if (condition === "true") {
          console.log("case default value:", value.replace(/'/g, ""));
          return value.replace(/'/g, ""); // Remove quotes
        }

        // Evaluate the condition
        const conditionResult = evaluateCondition(condition, row, context);
        console.log("case condition result:", conditionResult);

        if (conditionResult) {
          console.log("case value:", value.replace(/'/g, ""));
          return value.replace(/'/g, ""); // Remove quotes
        }
      }

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

    // Handle dateDiff
    const dateDiffMatch = expr.match(
      /dateDiff\(([^,]+),\s*([^,]+),\s*'([^']+)'\)/
    );
    if (dateDiffMatch) {
      const dateA = row[dateDiffMatch[1].trim()];
      const dateB = row[dateDiffMatch[2].trim()];
      const unit = dateDiffMatch[3] as "days" | "months" | "years";
      console.log("🔍 dateDiff match found:", {
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
    console.log(`evaluateCondition: "${condExpr}"`);

    // Handle settings references
    if (condExpr.includes("settings.")) {
      const settingsMatch = condExpr.match(
        /([^<>=!&|]+)\s*([<>=!]+)\s*settings\.([a-zA-Z_][a-zA-Z0-9_]*)/
      );
      if (settingsMatch) {
        const leftValue = evaluateValue(settingsMatch[1].trim(), row, context);
        const operator = settingsMatch[2].trim();
        const settingValue = context.settings?.[settingsMatch[3]];

        console.log(
          `settings comparison: ${leftValue} ${operator} ${settingValue}`
        );

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

      console.log(`comparison: ${leftValue} ${operator} ${rightValue}`);

      switch (operator) {
        case "<=":
          return Number(leftValue) <= Number(rightValue);
        case ">=":
          return Number(leftValue) >= Number(rightValue);
        case "<":
          return Number(leftValue) < Number(rightValue);
        case ">":
          return Number(leftValue) > Number(rightValue);
        case "==":
          return leftValue == rightValue;
        case "!=":
          return leftValue != rightValue;
      }
    }

    console.log(`condition evaluation failed for: "${condExpr}"`);
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
  console.log(`evaluateValue: "${trimmed}"`);

  // Handle numbers
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    console.log(`evaluateValue number: ${Number(trimmed)}`);
    return Number(trimmed);
  }

  // Handle field references
  if (row.hasOwnProperty(trimmed)) {
    console.log(`evaluateValue field "${trimmed}": ${row[trimmed]}`);
    return row[trimmed];
  }

  // Default return as is
  console.log(`evaluateValue default: "${trimmed}"`);
  return trimmed;
}

export function applyTransforms(
  rows: Row[],
  transforms?: { as: string; expr: string }[],
  context?: EngineContext
) {
  console.log("🔄 applyTransforms called:", {
    rowsLength: rows.length,
    transformsLength: transforms?.length || 0,
    transforms: transforms,
    firstRowKeys: rows.length > 0 ? Object.keys(rows[0]) : [],
  });

  if (!transforms?.length) {
    console.log("⚠️ No transforms to apply");
    return rows;
  }

  const ctx = context || { referenceTables: {}, settings: {} };

  const result = rows.map((r, index) => {
    const rr = { ...r };
    console.log(`🔄 Processing row ${index}:`, {
      originalKeys: Object.keys(r),
      originalData: index < 2 ? r : "...",
    });

    for (const t of transforms) {
      console.log(`🔧 Applying transform: ${t.as} = ${t.expr}`);
      const value = evaluateExpression(t.expr, rr, ctx);
      console.log(`🔧 Transform result: ${t.as} = ${value}`);
      rr[t.as] = value;
    }

    console.log(`🔄 Row ${index} after transforms:`, {
      newKeys: Object.keys(rr),
      newData: index < 2 ? rr : "...",
    });

    return rr;
  });

  console.log("✅ applyTransforms completed:", {
    resultLength: result.length,
    firstResultKeys: result.length > 0 ? Object.keys(result[0]) : [],
  });

  return result;
}

export function filterRows(rows: Row[], filters?: any[]) {
  if (!filters?.length) return rows;
  return rows.filter((r) => {
    return filters.every((f) => {
      const v = r[f.field];
      if (f.op === "=") return v === f.value;
      if (f.op === "<") return v < f.value;
      if (f.op === ">") return v > f.value;
      if (f.op === "in") return Array.isArray(f.value) && f.value.includes(v);
      return true;
    });
  });
}

export function groupAgg(
  rows: Row[],
  dimensions: string[] | undefined,
  measures: any[]
) {
  if (!measures?.length) return [];
  if (!dimensions?.length) {
    return [aggBucket({}, rows, measures)];
  }
  const keyOf = (r: Row) => dimensions.map((d) => String(r[d])).join("¬");
  const buckets = new Map<string, Row[]>();
  for (const r of rows) {
    const k = keyOf(r);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(r);
  }
  const out: Row[] = [];
  for (const [k, arr] of buckets.entries()) {
    const keys = k.split("¬");
    const base: Row = {};
    dimensions.forEach((d, i) => (base[d] = keys[i]));
    out.push(aggBucket(base, arr, measures));
  }
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
    transforms?: { as: string; expr: string }[];
    dataSources?: Array<{
      id: string;
      fieldTypes?: Record<string, string>;
      dateParsing?: Record<string, string>;
    }>;
  },
  dataSourceId: string = "uploaded-xml"
) {
  console.log("🏭 processDataWithManifest called:", {
    rowsLength: rows.length,
    dataSourceId,
    manifestKeys: Object.keys(manifest || {}),
    hasTransforms: !!(manifest && manifest.transforms),
    transformsLength: manifest?.transforms?.length || 0,
    transforms: manifest?.transforms,
    settings: manifest?.settings,
  });

  // 1. Find data source config
  const dataSource = manifest.dataSources?.find((ds) => ds.id === dataSourceId);
  console.log("🏭 Data source config:", dataSource);

  // 2. Apply type coercion
  let processedData = coerceTypes(
    rows,
    dataSource?.fieldTypes,
    dataSource?.dateParsing
  );
  console.log("🏭 After type coercion:", {
    length: processedData.length,
    firstRowKeys: processedData.length > 0 ? Object.keys(processedData[0]) : [],
    firstRowSample: processedData.length > 0 ? processedData[0] : null,
  });

  // 3. Apply transforms with context
  const context: EngineContext = {
    referenceTables: manifest.referenceTables || {},
    settings: manifest.settings || {},
  };

  console.log("🏭 About to call applyTransforms with:", {
    transforms: manifest.transforms,
    context,
  });

  processedData = applyTransforms(processedData, manifest.transforms, context);

  console.log("🏭 processDataWithManifest completed:", {
    resultLength: processedData.length,
    resultKeys: processedData.length > 0 ? Object.keys(processedData[0]) : [],
  });

  return processedData;
}
