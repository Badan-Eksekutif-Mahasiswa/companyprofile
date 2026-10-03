import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border-0 font-bold transition-all duration-base ease-out-expo active:translate-y-0 active:scale-[.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light [&_svg]:size-[1em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-accent text-white shadow-sm hover:-translate-y-px hover:bg-accent-hover hover:shadow-md",
        navy: "bg-navy text-white shadow-sm hover:-translate-y-px hover:bg-[#171d40] hover:shadow-md",
        blue: "bg-blue text-white shadow-sm hover:-translate-y-px hover:bg-blue-hover hover:shadow-md",
        outline: "border-[1.5px] border-solid border-border bg-white text-navy hover:border-navy hover:bg-navy-5",
        ghost: "bg-transparent text-secondary hover:bg-navy-5 hover:text-navy",
        danger: "bg-red text-white shadow-sm hover:bg-red-hover hover:shadow-md",
      },
      size: {
        lg: "px-8 py-4 text-[17px]",
        md: "px-6 py-3 text-[15px]",
        sm: "px-[18px] py-[9px] text-[13.5px]",
        xs: "px-3.5 py-1.5 text-[12.5px]",
      },
      icon: { true: "p-0", false: "" },
    },
    compoundVariants: [
      { icon: true, size: "lg", class: "size-14 text-[20px]" },
      { icon: true, size: "md", class: "size-[42px] text-[18px]" },
      { icon: true, size: "sm", class: "size-[34px] text-[16px]" },
      { icon: true, size: "xs", class: "size-7 text-[14px]" },
    ],
    defaultVariants: { variant: "primary", size: "md", icon: false },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof buttonVariants>, "icon"> {
  /** Tombol persegi/bulat berisi ikon saja. Wajib kasih aria-label. */
  iconOnly?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, iconOnly = false, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size, icon: iconOnly }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
