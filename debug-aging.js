// Debug script for aging calculation
const sampleData = [
  {
    DataDate: "2025-06-30",
    DocDate: "2024-06-09",
    QtyFromThisDoc: 8.0,
    AverageCost: 100.0,
    Prod: "AE001",
  },
  {
    DataDate: "2025-06-30",
    DocDate: "2025-05-19",
    QtyFromThisDoc: 15130.0,
    AverageCost: 100.0,
    Prod: "PVI-003",
  },
];

// Manual calculation - CORRECTED
console.log("Manual calculations (CORRECTED):");
sampleData.forEach((row, i) => {
  const dataDate = new Date(row.DataDate);
  const docDate = new Date(row.DocDate);
  const diffMs = dataDate.getTime() - docDate.getTime(); // DataDate - DocDate
  const daysAge = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  console.log(`Row ${i}:`, {
    DataDate: row.DataDate,
    DocDate: row.DocDate,
    daysAge: daysAge,
    bucket:
      daysAge > 365
        ? ">365"
        : daysAge > 180
          ? "181-365"
          : daysAge > 90
            ? "91-180"
            : daysAge >= 0
              ? "0-90"
              : "Expired",
    qty: row.QtyFromThisDoc,
    totalValue: row.QtyFromThisDoc * row.AverageCost,
  });
});
