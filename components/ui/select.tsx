import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: "default" | "compact";
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const widthClass = variant === "compact" ? "w-auto min-w-[120px]" : "w-full";
    
    // Theme-aware arrow color - uses muted-foreground which adapts to theme
    // Using a darker purple-gray that works in both themes
    const arrowColor = "6b7280"; // gray-500 that works in both themes
    
    return (
      <select
        className={cn(
          "flex h-10 rounded-md border-2 border-dashboard-card-border/60 bg-dashboard-card-bg px-3 py-2 text-sm text-text",
          "transition-all hover:border-dashboard-card-border focus:border-dashboard-card-border",
          "focus:outline-none focus:ring-2 focus:ring-dashboard-card-accent/50 focus:ring-offset-2 focus:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-dashboard-card-border/60",
          "appearance-none cursor-pointer",
          widthClass,
          className
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23${arrowColor}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: "right 0.5rem center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "1.5em 1.5em",
          paddingRight: "2.5rem",
        }}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

export { Select };

