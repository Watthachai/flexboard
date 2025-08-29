"use client";

import { VERSION_INFO } from "@/constants/version";

interface VersionDisplayProps {
  className?: string;
  showBuildDate?: boolean;
  variant?: "full" | "short" | "minimal";
}

export function VersionDisplay({
  className = "",
  showBuildDate = false,
  variant = "short",
}: VersionDisplayProps) {
  const renderContent = () => {
    switch (variant) {
      case "full":
        return (
          <div className={`text-sm text-muted-foreground ${className}`}>
            <div>{VERSION_INFO.displayName}</div>
            {showBuildDate && <div>Build: {VERSION_INFO.buildDate}</div>}
          </div>
        );
      case "minimal":
        return (
          <span className={`text-xs text-muted-foreground/60 ${className}`}>
            v{VERSION_INFO.version}
          </span>
        );
      case "short":
      default:
        return (
          <span className={`text-sm text-muted-foreground ${className}`}>
            {VERSION_INFO.name} v{VERSION_INFO.version}
          </span>
        );
    }
  };

  return renderContent();
}

// Hook สำหรับใช้ version info ใน components อื่น
export function useVersion() {
  return VERSION_INFO;
}
