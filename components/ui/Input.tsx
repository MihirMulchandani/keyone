import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full border-0 border-b border-[var(--border)] bg-transparent py-2 text-sm text-white outline-none focus:border-b-white ${className}`}
      {...props}
    />
  );
}
