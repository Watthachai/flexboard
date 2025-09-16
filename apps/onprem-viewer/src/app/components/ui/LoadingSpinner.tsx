/**
 * Beautiful Loading Spinner Component
 */

"use client";

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = "md",
  text = "Loading...",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-4 ${className}`}
    >
      {/* Spinning Logo */}
      <div className="relative">
        {/* Outer ring */}
        <div
          className={`${sizeClasses[size]} rounded-full border-4 border-gray-200 dark:border-gray-700`}
        ></div>

        {/* Spinning ring */}
        <div
          className={`absolute top-0 left-0 ${sizeClasses[size]} rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin`}
        ></div>

        {/* Inner dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Loading text with animation */}
      <div
        className={`${textSizeClasses[size]} text-gray-600 dark:text-gray-400 font-medium`}
      >
        <span className="inline-block animate-pulse">{text}</span>
        <span className="ml-1 animate-bounce">.</span>
        <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>
          .
        </span>
        <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>
          .
        </span>
      </div>
    </div>
  );
}

export function LoadingPage({
  text = "Loading dashboard...",
}: {
  text?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8">
        {/* Dashboard icon with animation */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <svg
              className="w-10 h-10 text-white animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </div>

        {/* Main loading spinner */}
        <LoadingSpinner size="lg" text={text} />

        {/* Progress indicators */}
        <div className="mt-8 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.3s" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>

        {/* Subtitle */}
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Please wait while we prepare your dashboard experience
        </p>
      </div>
    </div>
  );
}
