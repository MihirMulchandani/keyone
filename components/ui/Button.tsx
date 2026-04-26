"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "default" | "icon";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: Variant;
  fullWidth?: boolean;
  size?: Size;
  children?: ReactNode;
};

export function Button({
  className = "",
  loading,
  disabled,
  variant = "primary",
  fullWidth,
  size = "default",
  children,
  ...props
}: Props) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";
  const sizeStyles = size === "icon" ? "p-2" : "px-6 py-2.5";
  const variants: Record<Variant, string> = {
    primary: "bg-white text-black hover:bg-neutral-200",
    secondary: "border border-border bg-surface text-text hover:border-border-hover hover:bg-surface-hover",
    danger: "border border-danger-hover bg-danger text-white hover:bg-danger-hover",
    ghost: "text-text-muted hover:bg-surface-hover hover:text-text",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="spinner" aria-hidden /> : null}
      <span>{children}</span>
    </button>
  );
}
