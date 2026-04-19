import type { TextareaHTMLAttributes } from "react";

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full min-h-[160px] rounded-[2px] border border-[#444444] bg-black px-4 py-3 text-[15px] leading-relaxed text-white outline-none focus:border-white disabled:text-[#777777] ${className}`}
      {...props}
    />
  );
}
