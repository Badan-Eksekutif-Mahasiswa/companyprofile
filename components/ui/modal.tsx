"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  /** Biasanya dua <Button>; dibagi rata lebarnya. */
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Dialog berbasis <dialog> native: focus trap, Esc, dan inert background
 * ditangani browser lewat showModal().
 */
export function Modal({ open, onClose, icon, title, description, actions, children, className }: ModalProps) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn(
        "m-auto w-full max-w-[420px] rounded-2xl border-0 bg-white p-7 text-navy shadow-xl backdrop:bg-navy/40 backdrop:backdrop-blur-sm",
        className
      )}
    >
      {icon && (
        <div className="mb-[18px] flex size-[52px] items-center justify-center rounded-lg bg-pink-pale text-accent-hover [&_svg]:size-6">
          {icon}
        </div>
      )}
      <h3 id={titleId} className="mb-2 text-[19px]">
        {title}
      </h3>
      {description && <p className="mb-[22px] text-[14.5px] leading-relaxed text-secondary">{description}</p>}
      {children}
      {actions && <div className="flex gap-2.5 [&>*]:flex-1">{actions}</div>}
    </dialog>
  );
}
