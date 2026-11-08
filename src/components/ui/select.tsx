import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 px-3.5 py-2 text-xs text-zinc-900 dark:text-white shadow-xs transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900 focus-visible:border-zinc-900 dark:focus-visible:ring-zinc-100 dark:focus-visible:border-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 appearance-none font-sans cursor-pointer",
          error && "border-rose-500",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

export { Select };
