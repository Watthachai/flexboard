"use client";

import React from "react";
import { Search, FileX, AlertCircle, Database } from "lucide-react";

interface EmptyStateProps {
  type?: "search" | "no-data" | "error" | "filter";
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = "no-data",
  title,
  description,
  actionLabel,
  onAction,
  icon,
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "p-6 text-sm",
    md: "p-8 text-base",
    lg: "p-12 text-lg",
  };

  const iconSizes = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  };

  // Default configurations for different types
  const configs = {
    search: {
      icon: (
        <Search
          className={`${iconSizes[size]} text-gray-400 dark:text-slate-500`}
        />
      ),
      title: "ไม่พบผลการค้นหา",
      description: "ลองเปลี่ยนคำค้นหาหรือตรวจสอบการพิมพ์",
    },
    "no-data": {
      icon: (
        <FileX
          className={`${iconSizes[size]} text-gray-400 dark:text-slate-500`}
        />
      ),
      title: "ไม่มีข้อมูล",
      description: "ยังไม่มีข้อมูลที่จะแสดงในขณะนี้",
    },
    error: {
      icon: (
        <AlertCircle
          className={`${iconSizes[size]} text-red-400 dark:text-red-500`}
        />
      ),
      title: "เกิดข้อผิดพลาด",
      description: "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
    },
    filter: {
      icon: (
        <Database
          className={`${iconSizes[size]} text-gray-400 dark:text-slate-500`}
        />
      ),
      title: "ไม่มีข้อมูลที่ตรงกับเงื่อนไข",
      description: "ลองปรับเปลี่ยนตัวกรองหรือเพิ่มช่วงวันที่",
    },
  };

  const config = configs[type];

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]} ${className}`}
    >
      {/* Icon */}
      <div className="mb-4">{icon || config.icon}</div>

      {/* Title */}
      <h3 className="font-semibold text-gray-800 dark:text-slate-200 mb-2">
        {title || config.title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 dark:text-slate-400 max-w-md mb-6">
        {description || config.description}
      </p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
