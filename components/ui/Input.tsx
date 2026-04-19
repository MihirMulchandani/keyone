import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full min-h-[44px] rounded-[2px] border border-[#444444] bg-black px-4 py-3 text-[15px] text-white outline-none focus:border-white disabled:text-[#777777] ${className}`}
      {...props}
    />
  );
}
