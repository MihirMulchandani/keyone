import { forwardRef, type InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(({ className = "", label, error, ...props }, ref) => {
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? <label className="ml-1 text-xs font-medium text-text-muted">{label}</label> : null}
      <input
        ref={ref}
        className={`w-full rounded-none border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-muted/50 transition-colors focus:border-text-muted disabled:opacity-50 ${
          error ? "border-danger focus:border-danger" : ""
        } ${className}`}
        {...props}
      />
      {error ? <span className="ml-1 text-xs font-medium text-danger">{error}</span> : null}
    </div>
  );
});

Input.displayName = "Input";
