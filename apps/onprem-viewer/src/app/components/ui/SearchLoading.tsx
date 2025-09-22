"use client";

import React from "react";
import { Search, Loader2 } from "lucide-react";

interface SearchLoadingProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const SearchLoading: React.FC<SearchLoadingProps> = ({
  message = "กำลังค้นหา...",
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "p-4 text-sm",
    md: "p-8 text-base",
    lg: "p-12 text-lg",
  };

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]} ${className}`}
    >
      <div className="relative mb-4">
        {/* Background search icon */}
        <Search
          className={`${iconSizes[size]} text-gray-300 dark:text-slate-600 absolute inset-0`}
        />
        {/* Spinning loader */}
        <Loader2
          className={`${iconSizes[size]} text-blue-500 dark:text-blue-400 animate-spin`}
        />
      </div>

      <p className="text-gray-600 dark:text-slate-400 font-medium animate-pulse">
        {message}
      </p>

      {/* Optional loading dots */}
      <div className="flex items-center justify-center mt-2 space-x-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};

export default SearchLoading;
