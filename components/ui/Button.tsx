"use client";

import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean };

export function Button({ className = "", loading, disabled, children, ...props }: Props) {
  return (
    <button
      className={`group relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-[6px] border-2 border-white px-5 text-[14px] tracking-[0.5px] text-white transition-transform duration-200 ease-out active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      <span className="absolute inset-0 -translate-y-full bg-white transition-transform duration-500 ease-out group-hover:translate-y-0" />
      {loading ? <span className="spinner relative z-10" aria-hidden /> : null}
      <span className="relative z-10 transition-colors duration-500 group-hover:text-black">
        {children}
      </span>
    </button>
  );
}
