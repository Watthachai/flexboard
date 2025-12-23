"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import * as PopoverPrimitive from "@radix-ui/react-popover";

interface SingleSelectProps {
  options: string[];
  selected: string;
  onChange: (selected: string) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
  showRangeSelection?: boolean; // แสดงติ๊กทุกอันตั้งแต่ต้นจนถึงตัวที่เลือก
}

const OptionItem = React.memo(function OptionItem({
  option,
  isSelected,
  onClick,
}: {
  option: string;
  isSelected: boolean;
  onClick: (option: string) => void;
}) {
  return (
    <div
      onClick={() => onClick(option)}
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

export function SingleSelect({
  options,
  selected,
  onChange,
  placeholder = "เลือกรายการ",
  className,
  icon: Icon,
  showRangeSelection = false,
}: SingleSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = React.useCallback(
    (option: string) => {
      if (option === selected) {
        // Deselect if clicking the same option
        onChange("");
      } else {
        onChange(option);
      }
      setOpen(false);
    },
    [selected, onChange]
  );

  // Helper function to check if option is in range
  const isInRange = React.useCallback(
    (option: string) => {
      if (!showRangeSelection) return false;

      // ถ้าไม่ได้เลือก (selected = "") = เลือกทั้งหมด = ติ๊กทุกอัน
      if (!selected || selected === "") return true;

      const selectedIndex = options.indexOf(selected);
      const currentIndex = options.indexOf(option);

      return currentIndex >= 0 && currentIndex <= selectedIndex;
    },
    [showRangeSelection, selected, options]
  );

  const displayText = React.useMemo(() => {
    if (selected) {
      return selected;
    }
    return placeholder;
  }, [selected, placeholder]);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          className={cn(
            "flex h-10 items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm",
            "hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500",
            "dark:border-gray-600 dark:bg-slate-800 dark:hover:border-blue-400 dark:focus:border-blue-400",
            "transition-colors min-w-[200px]",
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
                selected
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
            "z-50 w-[var(--radix-popover-trigger-width)] rounded-lg border border-gray-200 bg-white p-1 shadow-lg",
            "dark:border-slate-700 dark:bg-slate-800",
            "animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
          )}
        >
          <div className="max-h-[300px] overflow-y-auto">
            {/* "ทั้งหมด" option */}
            <OptionItem
              option={placeholder}
              isSelected={selected === "" || !selected}
              onClick={() => handleSelect("")}
            />
            {options.map((option) => (
              <OptionItem
                key={option}
                option={option}
                isSelected={
                  showRangeSelection ? isInRange(option) : selected === option
                }
                onClick={handleSelect}
              />
            ))}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export const MemoizedSingleSelect = React.memo(SingleSelect);
