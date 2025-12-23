"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import * as PopoverPrimitive from "@radix-ui/react-popover";

interface RangeSelectProps {
  options: string[];
  fromSelected: string;
  toSelected: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function RangeSelect({
  options,
  fromSelected,
  toSelected,
  onFromChange,
  onToChange,
  placeholder = "เลือกช่วง",
  className,
  icon: Icon,
}: RangeSelectProps) {
  const [open, setOpen] = React.useState(false);

  // Handle "จาก" change - reset "ถึง" เมื่อเลือก "จาก" ใหม่
  const handleFromChange = React.useCallback(
    (value: string) => {
      onFromChange(value);
      // Reset "ถึง" ให้เป็นค่าว่าง เพื่อให้ user เลือกใหม่
      if (toSelected) {
        onToChange("");
      }
    },
    [onFromChange, onToChange, toSelected]
  );

  // Display text showing the selected range
  const displayText = React.useMemo(() => {
    if (!fromSelected && !toSelected) {
      return placeholder;
    }

    const from = fromSelected || "";
    const to = toSelected || "";

    // ถ้าเลือกแค่ from = แสดงเฉพาะ from
    if (from && !to) {
      return `${from} เท่านั้น`;
    }

    // ถ้าเลือกทั้ง from และ to
    if (from && to) {
      return `${from} - ${to}`;
    }

    // ถ้าเลือกแค่ to (ไม่น่าจะเกิด แต่เผื่อไว้)
    if (!from && to) {
      return `ถึง ${to}`;
    }

    return placeholder;
  }, [fromSelected, toSelected, placeholder]);

  // Helper to check if option is in selected range
  const isInRange = React.useCallback(
    (option: string) => {
      // ถ้าไม่ได้เลือก from = ไม่ติ๊กอะไรเลย
      if (!fromSelected) return false;

      // ถ้าเลือกทั้ง from และ to = ติ๊กช่วง
      if (fromSelected && toSelected) {
        const fromIndex = options.indexOf(fromSelected);
        const toIndex = options.indexOf(toSelected);
        const currentIndex = options.indexOf(option);

        // รองรับการเลือกย้อนกลับ
        const minIndex = Math.min(fromIndex, toIndex);
        const maxIndex = Math.max(fromIndex, toIndex);

        return currentIndex >= minIndex && currentIndex <= maxIndex;
      }

      // ถ้าเลือกแค่ from = ติ๊กเฉพาะตัวที่เลือก
      return option === fromSelected;
    },
    [fromSelected, toSelected, options]
  );

  // Helper สำหรับฝั่ง "ถึง" - ติ๊กเฉพาะตัวที่เลือกเท่านั้น
  const isToSelected = React.useCallback(
    (option: string) => {
      return toSelected === option;
    },
    [toSelected]
  );

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          className={cn(
            "flex h-10 items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm",
            "hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500",
            "dark:border-gray-600 dark:bg-slate-800 dark:hover:border-blue-400 dark:focus:border-blue-400",
            "transition-colors min-w-[280px]",
            className
          )}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {Icon && (
              <Icon className="h-4 w-4 text-gray-500 dark:text-slate-400 flex-shrink-0" />
            )}
            <span
              className={cn(
                "truncate text-left",
                fromSelected || toSelected
                  ? "text-gray-900 dark:text-slate-200"
                  : "text-gray-500 dark:text-slate-400"
              )}
            >
              {displayText}
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-gray-500 dark:text-slate-400 transition-transform flex-shrink-0",
              open && "transform rotate-180"
            )}
          />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className={cn(
            "z-50 w-[500px] rounded-lg border border-gray-200 bg-white p-4 shadow-lg",
            "dark:border-slate-700 dark:bg-slate-800",
            "animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
          )}
        >
          <div className="flex gap-4">
            {/* From Column */}
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-slate-300">
                จากกลุ่มสินค้า
              </h4>
              <div className="max-h-[300px] overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-md p-1">
                {options.map((option) => {
                  const inRange = isInRange(option);
                  return (
                    <div
                      key={`from-${option}`}
                      onClick={() => handleFromChange(option)}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none",
                        "hover:bg-slate-100 dark:hover:bg-slate-600",
                        inRange && "bg-blue-50 dark:bg-slate-800"
                      )}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-slate-300",
                          "dark:border-slate-500",
                          inRange &&
                            "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500"
                        )}
                      >
                        {inRange && <Check className="h-3 w-3" />}
                      </div>
                      <span className="text-gray-900 dark:text-slate-200">
                        {option}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* To Column */}
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-slate-300">
                ถึงกลุ่มสินค้า
              </h4>
              <div className="max-h-[300px] overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-md p-1">
                {options.map((option) => {
                  const selected = isToSelected(option);
                  return (
                    <div
                      key={`to-${option}`}
                      onClick={() => onToChange(option)}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none",
                        "hover:bg-slate-100 dark:hover:bg-slate-600",
                        selected && "bg-blue-50 dark:bg-slate-800"
                      )}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-slate-300",
                          "dark:border-slate-500",
                          selected &&
                            "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500"
                        )}
                      >
                        {selected && <Check className="h-3 w-3" />}
                      </div>
                      <span className="text-gray-900 dark:text-slate-200">
                        {option}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Apply/Close buttons */}
          <div className="flex justify-between gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
            <button
              onClick={() => {
                onFromChange("");
                onToChange("");
              }}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300 rounded-md hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
            >
              เคลียร์
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              ปิด
            </button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export const MemoizedRangeSelect = React.memo(RangeSelect);
