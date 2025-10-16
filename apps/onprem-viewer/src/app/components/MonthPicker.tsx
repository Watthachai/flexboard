"use client";

import React, { useState, useEffect } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface MonthPickerProps {
  selectedMonth: string; // Format: YYYY-MM
  setSelectedMonth: (month: string) => void;
}

const MonthPicker: React.FC<MonthPickerProps> = ({
  selectedMonth,
  setSelectedMonth,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelectedMonth, setTempSelectedMonth] = useState<number | null>(
    null
  );
  const [tempSelectedYear, setTempSelectedYear] = useState<number | null>(null);
  const [yearRangeStart, setYearRangeStart] = useState(
    new Date().getFullYear() - 5
  );

  const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const monthsShort = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];

  // Initialize temp values based on selectedMonth or current date
  useEffect(() => {
    if (selectedMonth) {
      const [year, month] = selectedMonth.split("-");
      setTempSelectedYear(parseInt(year));
      setTempSelectedMonth(parseInt(month) - 1);
    } else {
      const now = new Date();
      setTempSelectedYear(now.getFullYear());
      setTempSelectedMonth(now.getMonth());
    }
  }, [selectedMonth]);

  const formatDisplayMonth = (monthStr: string) => {
    if (!monthStr) return "เลือกเดือน";
    try {
      const [year, month] = monthStr.split("-");
      const yearThai = parseInt(year) + 543;
      return `${months[parseInt(month) - 1]} ${yearThai}`;
    } catch {
      return "เลือกเดือน";
    }
  };

  const handleMonthSelect = (month: number) => {
    setTempSelectedMonth(month);
  };

  const handleYearSelect = (year: number) => {
    setTempSelectedYear(year);
  };

  const handleApply = () => {
    if (tempSelectedMonth !== null && tempSelectedYear !== null) {
      const monthStr = `${tempSelectedYear}-${String(
        tempSelectedMonth + 1
      ).padStart(2, "0")}`;
      setSelectedMonth(monthStr);
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    if (selectedMonth) {
      const [year, month] = selectedMonth.split("-");
      setTempSelectedYear(parseInt(year));
      setTempSelectedMonth(parseInt(month) - 1);
    } else {
      const now = new Date();
      setTempSelectedYear(now.getFullYear());
      setTempSelectedMonth(now.getMonth());
    }
    setIsOpen(false);
  };

  const goToPreviousYears = () => {
    setYearRangeStart((prev) => prev - 12);
  };

  const goToNextYears = () => {
    setYearRangeStart((prev) => prev + 12);
  };

  const years = Array.from({ length: 12 }, (_, i) => yearRangeStart + i);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full min-w-[240px] px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          !selectedMonth
            ? "text-slate-400 dark:text-slate-500"
            : "text-slate-900 dark:text-slate-200"
        }`}
      >
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-slate-500" />
          <span>{formatDisplayMonth(selectedMonth)}</span>
        </div>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute z-20 top-full left-0 mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg p-4 min-w-[320px]">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 text-center">
              {tempSelectedMonth !== null && tempSelectedYear !== null
                ? `${months[tempSelectedMonth]} ${tempSelectedYear + 543}`
                : "เลือกเดือนและปี"}
            </div>

            {/* Year Selection */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  ปี
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPreviousYears}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-400"
                    title="ปีก่อนหน้า"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {yearRangeStart + 543} - {yearRangeStart + 11 + 543}
                  </span>
                  <button
                    onClick={goToNextYears}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-400"
                    title="ปีถัดไป"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => handleYearSelect(year)}
                    className={`px-3 py-2 text-sm rounded transition-colors ${
                      tempSelectedYear === year
                        ? "bg-blue-600 text-white"
                        : "hover:bg-blue-100 dark:hover:bg-blue-900 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {year + 543}
                  </button>
                ))}
              </div>
            </div>

            {/* Month Selection */}
            <div className="mb-4">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                เดือน
              </div>
              <div className="grid grid-cols-4 gap-2">
                {monthsShort.map((month, index) => (
                  <button
                    key={index}
                    onClick={() => handleMonthSelect(index)}
                    className={`px-3 py-2 text-sm rounded transition-colors ${
                      tempSelectedMonth === index
                        ? "bg-blue-600 text-white"
                        : "hover:bg-blue-100 dark:hover:bg-blue-900 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleApply}
                disabled={
                  tempSelectedMonth === null || tempSelectedYear === null
                }
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ตกลง
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MonthPicker;
