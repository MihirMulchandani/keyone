import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-[2px] border border-[#444444] bg-black px-3 py-2 text-sm text-white outline-none focus:border-white disabled:text-[#777777] ${className}`}
      {...props}
    />
  );
}
