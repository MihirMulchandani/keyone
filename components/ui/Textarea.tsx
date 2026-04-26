import type { TextareaHTMLAttributes } from "react";

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full resize-none rounded-none border border-border bg-surface p-4 text-sm text-white placeholder:text-text-muted transition-colors focus:border-text-muted focus:outline-none disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
