import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono",
  {
    variants: {
      variant: {
        default:
          "border border-indigo-700/60 bg-indigo-950/70 text-indigo-300",
        secondary:
          "border border-slate-700/60 bg-slate-800/80 text-slate-300",
        destructive:
          "border border-rose-800/60 bg-rose-950/70 text-rose-300",
        outline:
          "border border-slate-800 text-slate-400",
        success:
          "border border-emerald-800/60 bg-emerald-950/70 text-emerald-300",
        warning:
          "border border-amber-800/60 bg-amber-950/70 text-amber-300",
        info:
          "border border-sky-800/60 bg-sky-950/70 text-sky-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
