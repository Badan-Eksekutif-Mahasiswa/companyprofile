import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div className={cn("px-6 py-14 text-center", className)} {...props}>
      {icon && (
        <div className="mx-auto mb-[18px] flex size-16 items-center justify-center rounded-full bg-navy-5 text-navy-70 [&_svg]:size-7">
          {icon}
        </div>
      )}
      <h4 className="mb-1.5 text-base">{title}</h4>
      {description && <p className="mb-5 text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}
