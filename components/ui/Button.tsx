"use client";

import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean };

export function Button({ className = "", loading, disabled, children, ...props }: Props) {
  return (
    <button
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[2px] border border-white bg-transparent px-5 py-[11px] text-[15px] leading-none text-white transition-colors duration-150 hover:bg-[#111111] disabled:cursor-not-allowed disabled:text-[#777777] ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="spinner" aria-hidden /> : null}
      <span>{children}</span>
    </button>
  );
}
