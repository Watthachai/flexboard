import React, { useState } from "react";
import dayjs from "dayjs";

interface MonthYearPickerProps {
  value: string; // Format: "YYYY-MM" or "all"
  onChange: (value: string) => void;
  startYear?: number; // Default: 5 years ago
  endYear?: number; // Default: current year
  className?: string;
  placeholder?: string;
}

export default function MonthYearPicker({
  value,
  onChange,
  startYear,
  endYear,
  className = "",
}: MonthYearPickerProps) {
  const currentYear = dayjs().year();
  const defaultStartYear = startYear || 2000; // เปลี่ยนจาก currentYear - 5 เป็น 2000
  const defaultEndYear = endYear || currentYear;

  // Parse current value
  const [selectedYear, selectedMonth] =
    value !== "all"
      ? value.split("-").map(Number)
      : [currentYear, dayjs().month() + 1];

  const [tempYear, setTempYear] = useState(selectedYear);
  const [tempMonth, setTempMonth] = useState(selectedMonth);
  const [isOpen, setIsOpen] = useState(false);

  // Generate years array
  const years = Array.from(
    { length: defaultEndYear - defaultStartYear + 1 },
    (_, i) => defaultStartYear + i
  ).reverse(); // Most recent first

  // Thai month names
  const months = [
    { value: 1, label: "มกราคม", short: "ม.ค." },
    { value: 2, label: "กุมภาพันธ์", short: "ก.พ." },
    { value: 3, label: "มีนาคม", short: "มี.ค." },
    { value: 4, label: "เมษายน", short: "เม.ย." },
    { value: 5, label: "พฤษภาคม", short: "พ.ค." },
    { value: 6, label: "มิถุนายน", short: "มิ.ย." },
    { value: 7, label: "กรกฎาคม", short: "ก.ค." },
    { value: 8, label: "สิงหาคม", short: "ส.ค." },
    { value: 9, label: "กันยายน", short: "ก.ย." },
    { value: 10, label: "ตุลาคม", short: "ต.ค." },
    { value: 11, label: "พฤศจิกายน", short: "พ.ย." },
    { value: 12, label: "ธันวาคม", short: "ธ.ค." },
  ];

  const handleApply = () => {
    const formattedValue = `${tempYear}-${tempMonth
      .toString()
      .padStart(2, "0")}`;
    onChange(formattedValue);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("all");
    setIsOpen(false);
  };

  const getDisplayValue = () => {
    if (value === "all") return "ทุกวันที่";

    const month = months.find((m) => m.value === selectedMonth);
    return `${month?.short} ${selectedYear}`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <span>{getDisplayValue()}</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div
            className="absolute top-full left-0 z-[9999] mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl transform"
            style={{
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              // Prevent overflow and ensure visibility
              maxWidth: "calc(100vw - 2rem)",
              right: "auto",
            }}
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  เลือกปี-เดือน
                </h3>
                <button
                  onClick={handleClear}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ล้างการเลือก
                </button>
              </div>

              {/* Year Selection */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ปี
                </label>
                <select
                  value={tempYear}
                  onChange={(e) => setTempYear(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year} {year === currentYear ? "(ปีปัจจุบัน)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Grid */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  เดือน
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {months.map((month) => {
                    const isSelected = tempMonth === month.value;
                    const isCurrent =
                      tempYear === currentYear &&
                      month.value === dayjs().month() + 1;

                    return (
                      <button
                        key={month.value}
                        onClick={() => setTempMonth(month.value)}
                        className={`px-3 py-2 text-xs rounded-md transition-colors ${
                          isSelected
                            ? "bg-blue-500 text-white"
                            : isCurrent
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600"
                            : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                        }`}
                      >
                        {month.short}
                        {isCurrent && (
                          <div className="text-xs mt-1 opacity-75">
                            ปัจจุบัน
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleApply}
                  className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  ✅ เลือก
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  ยกเลิก
                </button>
              </div>

              {/* Preview */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  ตัวอย่าง: {months.find((m) => m.value === tempMonth)?.label}{" "}
                  {tempYear}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
