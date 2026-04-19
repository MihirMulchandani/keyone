import type { TextareaHTMLAttributes } from "react";

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-[2px] border border-[#444444] bg-black px-3 py-2 text-sm text-white outline-none focus:border-white disabled:text-[#777777] ${className}`}
      {...props}
    />
  );
}
