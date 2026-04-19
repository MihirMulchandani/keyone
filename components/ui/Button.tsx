"use client";

import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean };

export function Button({ className = "", loading, disabled, children, ...props }: Props) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-[2px] border border-[var(--border-strong)] px-4 text-[13px] text-white transition-colors duration-150 hover:border-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-30 ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="spinner" aria-hidden /> : null}
      <span>{children}</span>
    </button>
  );
}
