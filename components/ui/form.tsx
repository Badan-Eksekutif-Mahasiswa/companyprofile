import * as React from "react";
import { cn } from "@/lib/utils";

const controlClass =
  "w-full rounded-lg border-[1.5px] border-border bg-white px-4 py-[13px] text-[15px] text-navy outline-none transition-[border-color,box-shadow] duration-fast ease-out-expo placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-pink-pale aria-[invalid=true]:border-red";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(controlClass, className)} {...props} />
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(controlClass, "min-h-[110px] resize-y", className)} {...props} />
  )
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => <select ref={ref} className={cn(controlClass, className)} {...props} />
);
Select.displayName = "Select";

/** Input dengan ikon di kiri (mis. lucide <Mail />). */
export const InputWithIcon = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }
>(({ icon, className, ...props }, ref) => (
  <div className="relative">
    <span aria-hidden className="pointer-events-none absolute left-[15px] top-1/2 -translate-y-1/2 text-faint [&_svg]:size-[18px]">
      {icon}
    </span>
    <Input ref={ref} className={cn("pl-11", className)} {...props} />
  </div>
));
InputWithIcon.displayName = "InputWithIcon";

export interface FieldProps {
  label: string;
  /** id kontrol yang dilabeli. */
  htmlFor?: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-[7px]", className)}>
      <label htmlFor={htmlFor} className="text-[13.5px] font-bold text-navy">
        {label}
      </label>
      {children}
      {error ? (
        <span role="alert" className="text-[12.5px] font-semibold text-red">
          {error}
        </span>
      ) : (
        hint && <span className="text-[12.5px] text-muted">{hint}</span>
      )}
    </div>
  );
}

export const Checkbox = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { label: React.ReactNode }
>(({ label, className, ...props }, ref) => (
  <label className={cn("flex items-center gap-2.5 text-[14.5px] text-secondary", className)}>
    <input ref={ref} type="checkbox" className="size-[18px] rounded-sm accent-[var(--accent)]" {...props} />
    {label}
  </label>
));
Checkbox.displayName = "Checkbox";
