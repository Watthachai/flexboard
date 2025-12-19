"use client";

import * as React from "react";
import { Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import * as PopoverPrimitive from "@radix-ui/react-popover";

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// ✅ Memoized option item to prevent unnecessary re-renders
const OptionItem = React.memo(function OptionItem({
  option,
  isSelected,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
}: {
  option: string;
  isSelected: boolean;
  onMouseDown: (option: string, e: React.MouseEvent) => void;
  onMouseEnter: (option: string) => void;
  onMouseUp: () => void;
}) {
  return (
    <div
      onMouseDown={(e) => onMouseDown(option, e)}
      onMouseEnter={() => onMouseEnter(option)}
      onMouseUp={onMouseUp}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none",
        "hover:bg-slate-100 dark:hover:bg-slate-600",
        isSelected && "bg-blue-50 dark:bg-slate-800"
      )}
    >
      <div
        className={cn(
          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-slate-300",
          "dark:border-slate-500",
          isSelected &&
            "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500"
        )}
      >
        {isSelected && <Check className="h-3 w-3" />}
      </div>
      <span className="text-gray-900 dark:text-slate-200">{option}</span>
    </div>
  );
});

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "เลือกรายการ",
  className,
  icon: Icon,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  // ✅ Use staged selection to prevent parent re-render while selecting
  const [stagedSelected, setStagedSelected] =
    React.useState<string[]>(selected);

  // ✅ Sync staged selection when dropdown opens or selected prop changes externally
  React.useEffect(() => {
    if (open) {
      setStagedSelected(selected);
    }
  }, [open, selected]);

  // ✅ Apply staged selection when closing
  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (!newOpen && open) {
        // Dropdown is closing - apply the staged selection
        if (
          JSON.stringify(stagedSelected.sort()) !==
          JSON.stringify(selected.sort())
        ) {
          onChange(stagedSelected);
        }
      }
      setOpen(newOpen);
    },
    [open, stagedSelected, selected, onChange]
  );

  // ✅ Memoized callbacks to prevent re-renders - now using staged state
  const handleSelect = React.useCallback((option: string) => {
    setStagedSelected((current) => {
      if (current.includes(option)) {
        return current.filter((item) => item !== option);
      } else {
        return [...current, option];
      }
    });
  }, []);

  const handleMouseDown = React.useCallback(
    (option: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      handleSelect(option);
    },
    [handleSelect]
  );

  const handleMouseEnter = React.useCallback(
    (option: string) => {
      if (isDragging) {
        setStagedSelected((current) => {
          if (!current.includes(option)) {
            return [...current, option];
          }
          return current;
        });
      }
    },
    [isDragging]
  );

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClear = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setStagedSelected([]);
  }, []);

  const handleClose = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleOpenChange(false);
    },
    [handleOpenChange]
  );

  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => setIsDragging(false);
      document.addEventListener("mouseup", handleGlobalMouseUp);
      return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
    }
  }, [isDragging]);

  // ✅ Better display text for multiple selections
  const getDisplayText = () => {
    if (stagedSelected.length === 0) {
      return placeholder;
    }
    if (stagedSelected.length === 1) {
      return stagedSelected[0];
    }
    if (stagedSelected.length <= 2) {
      return stagedSelected.join(", ");
    }
    // Show first item + count for many selections
    return `${stagedSelected[0]} +${stagedSelected.length - 1} รายการ`;
  };

  const displayText = getDisplayText();

  return (
    <div className="relative flex items-center">
      {Icon && (
        <Icon className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
      )}
      <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-10 items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm",
              "hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600",
              "min-w-[200px] max-w-[300px]",
              className
            )}
          >
            <span
              className={cn(
                "truncate text-left flex-1",
                stagedSelected.length > 0
                  ? "text-gray-900 dark:text-slate-200 font-medium"
                  : "text-gray-500 dark:text-slate-400"
              )}
              title={displayText}
            >
              {displayText}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            className={cn(
              "z-50 rounded-lg border border-slate-300 bg-white shadow-lg outline-none",
              "dark:border-slate-600 dark:bg-slate-700",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "w-[var(--radix-popover-trigger-width)] min-w-[200px]"
            )}
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-700">
              {/* Selected count and clear button */}
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    เลือกแล้ว: {stagedSelected.length} รายการ
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium"
                  >
                    ล้างทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Hint */}
            <div className="bg-blue-50 px-3 py-1 text-xs text-gray-500 dark:bg-slate-800 dark:text-slate-400">
              💡 คลิกลากเพื่อเลือกหลายๆ รายการพร้อมกัน
            </div>

            {/* Options */}
            <div className="max-h-60 overflow-y-auto p-1">
              {options.map((option) => (
                <OptionItem
                  key={option}
                  option={option}
                  isSelected={stagedSelected.includes(option)}
                  onMouseDown={handleMouseDown}
                  onMouseEnter={handleMouseEnter}
                  onMouseUp={handleMouseUp}
                />
              ))}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
      {options.length > 0 && (
        <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
          ({options.length})
        </span>
      )}
    </div>
  );
}

// ✅ Export memoized version to prevent unnecessary re-renders
export const MemoizedMultiSelect = React.memo(
  MultiSelect,
  (prevProps, nextProps) => {
    // Only re-render if these props actually change
    return (
      prevProps.placeholder === nextProps.placeholder &&
      prevProps.className === nextProps.className &&
      prevProps.icon === nextProps.icon &&
      prevProps.options.length === nextProps.options.length &&
      prevProps.options.every((opt, i) => opt === nextProps.options[i]) &&
      prevProps.selected.length === nextProps.selected.length &&
      prevProps.selected.every((sel, i) => sel === nextProps.selected[i])
    );
  }
);
