/**
 * Alert Component
 * Simple alert component for displaying messages
 */

import React from "react";
import { cn } from "@/lib/utils";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive";
  children: React.ReactNode;
}

export function Alert({
  className,
  variant = "default",
  children,
  ...props
}: AlertProps) {
  return (
    <div
      className={cn(
        "relative w-full rounded-lg border p-4",
        {
          "border-gray-200 bg-gray-50 text-gray-900": variant === "default",
          "border-red-200 bg-red-50 text-red-900": variant === "destructive",
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface AlertDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function AlertDescription({
  className,
  children,
  ...props
}: AlertDescriptionProps) {
  return (
    <div className={cn("text-sm [&_p]:leading-relaxed", className)} {...props}>
      {children}
    </div>
  );
}
