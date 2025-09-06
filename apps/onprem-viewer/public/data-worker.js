/**
 * Web Worker for processing large datasets
 * Handles data transformation in background thread
 */

// Simple data processing functions (subset of engine.ts)
function processDataChunk(rows, transforms, chunkSize = 100) {
  const results = [];

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const processedChunk = chunk.map((row) => {
      const newRow = { ...row };

      // Apply transforms
      transforms.forEach((transform) => {
        try {
          // Simple expression evaluation for common cases
          if (transform.expr.includes("coalesce")) {
            const field = transform.expr.match(/coalesce\((\w+),\s*(\d+)\)/);
            if (field) {
              newRow[transform.as] = newRow[field[1]] || parseInt(field[2]);
            }
          } else if (transform.expr.includes("dateDiff")) {
            // Handle date difference
            const fields = transform.expr.match(
              /dateDiff\((\w+),\s*(\w+),\s*'(\w+)'\)/
            );
            if (fields) {
              const date1 = new Date(newRow[fields[1]]);
              const date2 = new Date(newRow[fields[2]]);
              const diffMs = date1.getTime() - date2.getTime();
              newRow[transform.as] = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            }
          } else if (transform.expr.includes("case(")) {
            // Handle case expressions for AgeBucket
            if (transform.as === "AgeBucket") {
              const daysAge = newRow.DaysAge || 0;
              if (daysAge > 365) newRow[transform.as] = ">365";
              else if (daysAge > 180) newRow[transform.as] = "181-365";
              else if (daysAge > 90) newRow[transform.as] = "91-180";
              else if (daysAge >= 0) newRow[transform.as] = "0-90";
              else newRow[transform.as] = "Expired";
            }
          } else if (transform.expr.includes("*")) {
            // Handle multiplication
            const parts = transform.expr.split("*").map((p) => p.trim());
            if (parts.length === 2) {
              const val1 = newRow[parts[0]] || 0;
              const val2 = newRow[parts[1]] || 0;
              newRow[transform.as] = val1 * val2;
            }
          }
        } catch (error) {
          console.warn(`Transform error for ${transform.as}:`, error);
          newRow[transform.as] = 0;
        }
      });

      return newRow;
    });

    results.push(...processedChunk);

    // Send progress update
    if (i % (chunkSize * 10) === 0) {
      postMessage({
        type: "progress",
        processed: results.length,
        total: rows.length,
      });
    }
  }

  return results;
}

// Worker message handler
self.onmessage = function (e) {
  const { type, data, transforms, chunkSize } = e.data;

  if (type === "processData") {
    try {
      const result = processDataChunk(data, transforms, chunkSize);
      postMessage({
        type: "completed",
        data: result,
      });
    } catch (error) {
      postMessage({
        type: "error",
        error: error.message,
      });
    }
  }
};
