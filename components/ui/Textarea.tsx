import type { TextareaHTMLAttributes } from "react";

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-[2px] border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-white ${className}`}
      {...props}
    />
  );
}
