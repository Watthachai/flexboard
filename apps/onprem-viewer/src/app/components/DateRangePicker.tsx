"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, CalendarDays } from "lucide-react";
import { createPortal } from "react-dom";

interface DateRangePickerProps {
  value?: { startDate: string; endDate: string } | null;
  onChange: (range: { startDate: string; endDate: string } | null) => void;
  placeholder?: string;
  startDateLabel?: string;
  endDateLabel?: string;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  placeholder = "เลือกช่วงวันที่",
  startDateLabel = "ตั้งแต่",
  endDateLabel = "จนถึง",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  useEffect(() => {
    if (value) {
      setTempStartDate(value.startDate);
      setTempEndDate(value.endDate);
    } else {
      setTempStartDate("");
      setTempEndDate("");
    }
  }, [value]);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 320),
      });
    }
  }, [isOpen]);

  const formatDisplayValue = () => {
    if (!value || !value.startDate || !value.endDate) {
      return placeholder;
    }

    const startDate = new Date(value.startDate);
    const endDate = new Date(value.endDate);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const handleApply = () => {
    if (tempStartDate && tempEndDate) {
      onChange({ startDate: tempStartDate, endDate: tempEndDate });
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setTempStartDate("");
    setTempEndDate("");
    setIsOpen(false);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
      const dropdown = document.getElementById("date-range-dropdown");
      if (dropdown && !dropdown.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const isValidRange =
    tempStartDate &&
    tempEndDate &&
    new Date(tempStartDate) <= new Date(tempEndDate);

  const dropdown = isOpen ? (
    <div
      id="date-range-dropdown"
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-80"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
      }}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <CalendarDays className="w-4 h-4" />
          เลือกช่วงวันที่
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {startDateLabel}
            </label>
            <input
              type="date"
              value={tempStartDate}
              onChange={(e) => setTempStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {endDateLabel}
            </label>
            <input
              type="date"
              value={tempEndDate}
              onChange={(e) => setTempEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {tempStartDate && tempEndDate && !isValidRange && (
          <div className="text-red-500 text-sm">
            วันที่เริ่มต้นต้องน้อยกว่าหรือเท่ากับวันที่สิ้นสุด
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            ล้าง
          </button>
          <button
            onClick={handleApply}
            disabled={!isValidRange}
            className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-1"
          >
            ตกลง
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          hover:border-gray-400 transition-colors flex items-center justify-between
          ${className}
        `}
      >
        <span
          className={`truncate ${!value ? "text-gray-500" : "text-gray-900"}`}
        >
          {formatDisplayValue()}
        </span>
        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
      </button>

      {typeof window !== "undefined" && createPortal(dropdown, document.body)}
    </>
  );
};

export default DateRangePicker;
