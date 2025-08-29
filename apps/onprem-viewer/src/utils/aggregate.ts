type Measure =
  | { field: string; as: string; agg: "sum" | "count" | "min" | "max" | "avg" }
  | {
      expr: (row: any) => number;
      as: string;
      agg: "sum" | "avg" | "min" | "max";
    };

export function aggregateBy(
  rows: any[],
  groupBy: string[],
  measures: Measure[]
) {
  const keyOf = (r: any) => groupBy.map((k) => String(r[k] ?? "")).join("␟");
  const buckets = new Map<string, any[]>();
  for (const r of rows) {
    const k = keyOf(r);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(r);
  }

  const out: any[] = [];
  for (const [k, arr] of buckets.entries()) {
    const base: any = {};
    groupBy.forEach((g, i) => {
      base[g] = arr[0]?.[g] ?? null;
    });

    for (const m of measures) {
      const vals = arr
        .map((r) =>
          "expr" in m ? Number(m.expr(r) || 0) : Number(r[m.field] || 0)
        )
        .filter((v) => !isNaN(v));
      let v = 0;
      switch (m.agg) {
        case "sum":
          v = vals.reduce((a, b) => a + b, 0);
          break;
        case "count":
          v = arr.length;
          break;
        case "min":
          v = vals.length ? Math.min(...vals) : 0;
          break;
        case "max":
          v = vals.length ? Math.max(...vals) : 0;
          break;
        case "avg":
          v = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
          break;
      }
      base[m.as] = v;
    }
    out.push(base);
  }
  return out;
}
