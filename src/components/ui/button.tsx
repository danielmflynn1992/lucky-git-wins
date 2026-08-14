import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-display uppercase tracking-[0.12em] text-[13px] cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink-red)] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-px [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "btn-primary",
        destructive: "btn-primary",
        outline: "btn-secondary",
        secondary: "btn-secondary",
        ghost: "btn-tertiary",
        link: "btn-tertiary",
        gold: "btn-primary",
        git: "btn-secondary",
        hot: "btn-primary",
        cream: "btn-secondary",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-[12px]",
        lg: "h-10 px-5 text-[14px]",
        xl: "h-11 px-6 text-[15px]",
        icon: "h-9 w-9 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
