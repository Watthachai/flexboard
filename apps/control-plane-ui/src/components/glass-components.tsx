import { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className,
  style,
  hover = false,
  onClick,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card",
        hover && "cursor-pointer hover:bg-white/25 dark:hover:bg-white/10",
        className
      )}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface GlassButtonProps {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
}

export function GlassButton({
  children,
  className,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
}: GlassButtonProps) {
  const baseClasses =
    "glass-button font-medium transition-all duration-200 inline-flex items-center justify-center";

  const variants = {
    primary: "text-white hover:bg-white/30",
    secondary: "text-white/80 hover:text-white hover:bg-white/20",
    ghost: "text-white/60 hover:text-white hover:bg-white/10",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

interface GlassInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  type?: string;
}

export function GlassInput({
  placeholder,
  value,
  onChange,
  className,
  type = "text",
}: GlassInputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={cn(
        "glass-input text-white placeholder-white/40 w-full",
        className
      )}
    />
  );
}

interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "error";
  children: ReactNode;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const statusClasses = {
    active: "status-active",
    inactive: "status-inactive",
    pending:
      "px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    error:
      "px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-300 border border-red-500/30",
  };

  return <span className={statusClasses[status]}>{children}</span>;
}
