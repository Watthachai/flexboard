/**
 * Multi-Select Dropdown Component
 * For use in global filters and other multi-select scenarios
 */

import React, { useState, useEffect, useRef } from "react";

interface DropdownOption {
  label: string;
  value: string;
}

interface MultiSelectDropdownProps {
  options: DropdownOption[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  maxDisplayItems?: number;
  className?: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder,
  maxDisplayItems = 3,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const toggleOption = (value: string) => {
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newSelected);
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectAll = () => {
    onChange(options.map((opt) => opt.value));
  };

  const displayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const option = options.find((opt) => opt.value === selectedValues[0]);
      return option?.label || selectedValues[0];
    }
    if (selectedValues.length <= maxDisplayItems) {
      return selectedValues
        .map((val) => {
          const option = options.find((opt) => opt.value === val);
          return option?.label || val;
        })
        .join(", ");
    }
    return `${selectedValues
      .slice(0, maxDisplayItems)
      .map((val) => {
        const option = options.find((opt) => opt.value === val);
        return option?.label || val;
      })
      .join(", ")} +${selectedValues.length - maxDisplayItems} more`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between"
        title={displayText()}
      >
        <span className="truncate flex-1">{displayText()}</span>
        <span className="ml-2 text-gray-400 flex-shrink-0">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {/* Control buttons */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Clear All
              </button>
              <span className="text-xs text-gray-600 dark:text-gray-300 py-1">
                {selectedValues.length} of {options.length} selected
              </span>
            </div>
          </div>

          {/* Options list */}
          <div className="py-1">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => toggleOption(option.value)}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
