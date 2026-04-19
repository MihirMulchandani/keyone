"use client";

import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean };

export function Button({ className = "", loading, disabled, children, ...props }: Props) {
  return (
    <button
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-[2px] border border-[var(--border)] px-3.5 text-[13px] text-white transition-colors hover:border-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-30 ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="spinner" aria-hidden /> : null}
      {children}
    </button>
  );
}
